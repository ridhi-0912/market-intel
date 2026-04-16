# Design Decisions

This document captures the key architectural and product trade-offs made during
development, along with the reasoning behind each choice.

---

## 1. Scraping: axios + cheerio over Playwright

Blogs, announcement pages, and press releases are static HTML — no JavaScript
rendering is needed to extract their content. Cheerio with type-specific CSS
selectors runs in-process, is significantly faster than a headless browser, has
no binary dependencies, and deploys without friction on serverless platforms.
Playwright would add cold-start latency, memory pressure, and incompatibility
with Vercel's serverless runtime, with no meaningful benefit for this class of
sources.


---

## 2. Full context window over RAG

At 3–10 URLs per run, all scraped content fits comfortably within GPT-4o's
128K-token context window. Sending the full corpus in a single prompt produces
better cross-source synthesis than retrieval: RAG chunking breaks the coherence
between related paragraphs and risks missing connections that span multiple
sources. The full-context approach is also simpler to reason about and debug —
there is no retrieval layer that can silently drop relevant content.

---

## 3. Role perspective baked into generation, not applied as a filter

An early design generated a generic report and then added per-role summary
panels as a post-processing step. This was replaced with a single approach:
the selected role's definition is injected directly into the analyzer prompt
before the model sees any content.

Each role definition specifies what to prioritize, what lens to apply, and
a framing question that shapes every theme and insight:

- **Product Manager** — feature gaps, competitive parity, roadmap signals. *"What does this mean for our product?"*
- **Executive** — strategic threats, market momentum, M&A signals. *"Does this change our competitive position?"*
- **Sales / BD** — objection-handling material, differentiators, deal impact. *"What do I say when a prospect brings this up?"*
- **Engineering Lead** — architecture choices, API changes, build-vs-buy signals. *"Does this create integration risk or opportunity?"*

The model generates themes, insights, and competitor activities that are already
framed for the target audience — not a generic report with a role-specific
paragraph bolted on.

---

## 4. Cross-competitor topic clustering

The natural failure mode for a multi-competitor report is per-competitor
grouping: one theme for Stripe, one for Plaid. This defeats the purpose of
comparative intelligence — a reader needs to see *where competitors are moving
in the same direction* and *where they diverge*.

The analyzer prompt explicitly instructs the model:

> *"Themes MUST be organized by TOPIC, not by competitor. If multiple competitors
> have activity in the same area (e.g. pricing changes, API launches), those
> insights MUST be grouped into a single shared theme."*

Each theme is assigned a `clusterLabel` (Product / Pricing / Partnerships /
Growth / M&A / Engineering / Other) and displayed under that label in the UI.
Themes within the same cluster contain insights from all relevant competitors,
allowing direct comparison within a topic area.

---

## 5. Chain-of-Thought for the analyzer

Without an explicit scratchpad, the model tends to generate theme labels before
grounding them in individual sources — producing themes that sound coherent but
lack traceable evidence. The prompt requires the model to first enumerate raw
facts per source URL (Step 1 — scratchpad) before grouping them into themes
(Step 2). This CoT structure measurably reduces theme-level fabrication and
makes the evidence trail auditable. The scratchpad is stripped server-side
before the report is returned to the client.

---

## 6. Chain of Verification for the judge (LLM-as-a-judge)

A simple "is this claim supported?" prompt yields lenient verdicts because the
model reasons by association rather than by direct lookup. Chain of Verification
forces the judge through a two-step process:

1. Formulate a precise, falsifiable question: *"Does any source explicitly state that...?"*
2. Locate a verbatim answer in the source text — or report "no evidence found"

Only if a direct answer is found does the judge rule `supported`. This closes the
gap between "plausible given the source" and "actually stated in the source."
The judge also assigns a confidence score (0–1) and explanation for every claim,
so flagged claims can be presented to the user with context.

---

## 7. Two models: GPT-4o for analysis, GPT-4o-mini for verification

Cross-source synthesis — identifying themes across multiple competitors, weighing
evidence, and constructing a coherent role-specific narrative — requires strong
reasoning. GPT-4o handles this at temperature 0.4 to allow creative grouping
while keeping claims grounded.

Hallucination verification is mechanical: locate a specific claim in a specific
passage. GPT-4o-mini is sufficient for this task at temperature 0 and is
materially cheaper per token. Since the judge runs once per claim across every
insight in the report, the cost difference compounds significantly at scale.

---

## 8. Pipeline error-safety: report always delivered if scraping and analysis succeed

The pipeline has five stages: scraping, analysis, hallucination verification,
change detection, and persistence. An early implementation wrapped all five in a
single try/catch — a failure in the judge or the database would silently discard
a completed report.

The current design treats stages differently by criticality:

- **Scraping and analysis** are hard requirements. If all URLs fail to scrape,
  or if the analyzer throws, there is nothing to report — the pipeline stops and
  emits an error.
- **Hallucination verification** degrades gracefully: if the judge call fails,
  the report is emitted with an empty verification result rather than discarded.
- **Change detection** degrades gracefully: if embeddings or the DB lookup fail,
  `changeDetection` is set to `null` and the report is still delivered.
- **Persistence** is fire-and-forget: `emit({ stage: "complete", report })` runs
  before `db.saveRun()`, so a database error never blocks the client from
  receiving the report.

---

## 9. Three-level change detection, scoped by role

Change detection compares the current run against the most recent prior run on
the same URL set **and the same role**. Scoping by role is intentional: a PM run
and an Exec run on the same URLs produce structurally different themes (different
framing, different prioritisation), so comparing them would produce meaningless
"changes" that are artefacts of the role switch rather than actual content drift.

The three detection levels are:

- **L1 — Content hash (SHA-256):** Detects pages whose raw text changed between
  runs. Fast, exact, zero false positives.
- **L2 — Theme title diff:** String set comparison of theme titles to identify
  newly appeared or disappeared topics.
- **L3 — Semantic drift (cosine similarity):** Each theme's title and summary is
  embedded using `text-embedding-3-small`. Cosine similarity between current and
  prior theme vectors identifies themes that were not renamed but shifted in
  meaning (similarity 0.70–0.92). Above 0.92 is considered the same theme;
  below 0.70 is considered a new theme.

---

## 10. SQLite locally, Vercel KV (Upstash) in production

The `DbAdapter` interface defines four async methods (`saveRun`, `getRun`,
`listRuns`, `getLatestRunForUrlsHash`). Two implementations satisfy this
interface: a `better-sqlite3` adapter for local development and an Upstash
Redis adapter (`@vercel/kv`) for production.

The correct implementation is selected at module load time based on whether
the KV REST API environment variables are present. On Vercel, the filesystem
is read-only, so the SQLite adapter writes to `/tmp/runs.db` as a fallback
when KV is not configured — this allows the pipeline to run but does not
persist history across cold starts.

Making the interface fully async (rather than the original synchronous
signatures) was necessary because the KV adapter uses network I/O and
cannot return results synchronously. The SQLite adapter wraps its synchronous
calls in `async` functions to satisfy the same contract.

---
