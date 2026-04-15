# Design Decisions

This document captures the key architectural and product trade-offs made during development, along with the reasoning behind each choice.

---

## Scraping: axios + cheerio over Playwright

Blogs, announcement pages, and press releases are static HTML — no JavaScript rendering is needed to extract their content. Cheerio with type-specific CSS selectors runs in-process, is 10× faster than a headless browser, has no binary dependencies, and deploys without friction on serverless platforms. Playwright would add cold-start latency, memory pressure, and Vercel incompatibility with no meaningful benefit for this class of sources.

## Context window over RAG

At 3–10 URLs per run, all scraped content comfortably fits within a 200K-token context window. Sending the full corpus in a single prompt produces better cross-source synthesis than retrieval: RAG chunking breaks the coherence between related paragraphs and risks missing connections that span multiple sources. The full-context approach is also simpler to reason about and debug — there is no retrieval layer that can silently drop relevant content.

## SQLite over a vector database

Change detection operates at three levels: exact hash comparison (content unchanged), string set diffing (themes added or removed), and cosine similarity on a small number of theme vectors (semantic drift). All three run in-process using SQLite's JSON columns and a lightweight utility function. A dedicated vector database would add operational overhead and a network dependency for a problem that does not exceed a handful of vectors per run.

## Chain-of-Thought for the analyzer

Without an explicit scratchpad, the model tends to generate theme labels before grounding them in individual sources — producing themes that sound coherent but lack traceable evidence. Requiring the model to enumerate raw facts per source before clustering measurably reduces theme-level fabrication and makes the evidence trail auditable.

## Chain of Verification for the judge

A simple "is this claim supported?" prompt yields lenient verdicts because the model judges by association rather than by direct lookup. Chain of Verification forces the judge to first formulate a precise, falsifiable question and then locate a verbatim answer in the source text before ruling. This closes the gap between "plausible given the source" and "actually stated in the source."

## Two models: GPT-4o for analysis, GPT-4o-mini for verification

Cross-source synthesis — identifying themes, weighing evidence, and constructing a coherent narrative — requires strong reasoning. GPT-4o handles this. Hallucination verification is mechanical: locate a specific claim in a specific passage. GPT-4o-mini is sufficient for this task and materially cheaper, which matters when it runs once per claim across every theme in every report.

## Pre-generating role-specific summaries

The marginal token cost of generating PM, Executive, Sales, and Engineering summaries in a single LLM call is small (~200–400 tokens per additional role). Pre-generating all variants at analysis time means the user can switch perspectives in the UI instantly, without triggering a new API call. The cost is paid once; the latency saving applies on every toggle.

## Server-Sent Events over WebSockets

The analysis pipeline is unidirectional: the server pushes progress updates and a final result; the client never sends mid-stream messages. SSE is the appropriate primitive for this pattern — it runs over HTTP/1.1, requires no upgrade handshake, and is natively supported by the browser `EventSource` API. WebSockets would add unnecessary bidirectional complexity for what is effectively a long-running job with a progress stream.
