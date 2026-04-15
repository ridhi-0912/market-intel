# Market Intelligence

> Collect, analyze, and summarize competitive intelligence from blogs,
> announcement pages, and articles — in under 30 seconds.

## Problem Statement

Product and GTM teams struggle to stay current on competitor activity because
relevant information is scattered across blogs, newsrooms, and article pages.
Manually reading and synthesizing these sources is slow, inconsistent, and easy
to deprioritize.

This app lets a user paste competitor names and source URLs, then automatically
fetches and analyzes the content using Claude to produce a structured report —
grouped by themes, grounded in sources, and verified for accuracy. On repeat
runs against the same URLs, it surfaces what changed since last time.

## Architecture & Tech Stack

```
Browser (Next.js React)
    │  POST /api/analyze  [Server-Sent Events]
    ▼
Next.js Route Handler
    ├── scraper.ts      axios + cheerio          fetch & extract static HTML content
    ├── analyzer.ts     GPT-4o (CoT)             structured intelligence report
    ├── judge.ts        GPT-4o-mini (CoVe)       per-claim hallucination verification
    ├── change.ts       SHA-256 + cosine sim     content & semantic drift detection
    └── db.ts           SQLite / Vercel KV       run persistence & history
```

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 App Router (TypeScript) | Full-stack, single deploy |
| Scraping | axios + cheerio | Type-specific static HTML extraction |
| Analysis | GPT-4o | Multi-source synthesis with Chain-of-Thought |
| Verification | GPT-4o-mini | LLM-as-a-judge with Chain of Verification |
| Embeddings | OpenAI text-embedding-3-small | Semantic drift detection for change tracking |
| Persistence | better-sqlite3 / Vercel KV | Run history, change detection |
| Streaming | Server-Sent Events (SSE) | Per-stage progress |
| Deployment | Vercel | Public URL |

## Local Build & Run

Prerequisites: Node.js 18+, OpenAI API key

```bash
git clone <repo-url> && cd market-intel
npm install
cp .env.example .env.local   # add OPENAI_API_KEY
npm run dev                  # http://localhost:3000
```

## Production Deploy (Vercel)

```bash
npm i -g vercel
vercel
vercel env add OPENAI_API_KEY
vercel --prod
# Link a Vercel KV store in the dashboard for persistent run history
```

## AI Tools / Models / Libraries Used

| Tool | Version | Usage |
|---|---|---|
| openai | latest | OpenAI API client (GPT-4o, GPT-4o-mini, embeddings) |
| GPT-4o | — | Market intelligence analysis (Chain-of-Thought) |
| GPT-4o-mini | — | Hallucination verification (Chain of Verification) |
| text-embedding-3-small | — | Theme embeddings for semantic change detection |
| axios | latest | HTTP requests for URL scraping |
| cheerio | latest | Server-side HTML parsing |
| better-sqlite3 | latest | Local SQLite persistence |
| @vercel/kv | latest | Production key-value store (Vercel) |
| zod | latest | Request validation + SSRF protection |
| p-limit | latest | Scraping concurrency control |
