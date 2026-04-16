# Market Intelligence

> Collect, analyze, and summarize competitive intelligence from blogs,
> announcement pages, and articles — in under 30 seconds.

**Live app:** https://market-intel-rouge.vercel.app

---

## Problem Statement

Product and GTM teams struggle to stay current on competitor activity because
relevant information is scattered across blogs, newsrooms, and article pages.
Manually reading and synthesizing these sources is slow, inconsistent, and easy
to deprioritize.

This app lets a user paste competitor names and source URLs, select a role
perspective (Product Manager, Executive, Sales, Engineering), and automatically
receives a structured market intelligence report — topics clustered across
competitors, every insight traced to its source, and every claim independently
verified for hallucinations. On repeat runs against the same URLs and role, it
surfaces what changed since last time.

---

## Architecture & Tech Stack

```
Browser (Next.js React)
    │  POST /api/analyze  [Server-Sent Events]
    ▼
Next.js Route Handler (/api/analyze)
    ├── scraper.ts      axios + cheerio          fetch & extract static HTML
    ├── analyzer.ts     GPT-4o  (CoT)            role-aware structured report
    ├── judge.ts        GPT-4o-mini  (CoVe)      per-claim hallucination check
    ├── change.ts       SHA-256 + cosine sim     content & semantic drift
    └── db.ts           SQLite (local)           run persistence & history
                        Upstash KV (production)
```

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js App Router (TypeScript) | 16.2.3 | Full-stack, single deploy, shared types |
| Scraping | axios + cheerio | ^1.15.0 / ^1.2.0 | Type-specific static HTML extraction |
| Analysis | GPT-4o via OpenAI API | openai ^6.34.0 | Role-aware multi-source synthesis (Chain-of-Thought) |
| Verification | GPT-4o-mini via OpenAI API | openai ^6.34.0 | LLM-as-a-judge per-claim fact checking (Chain of Verification) |
| Embeddings | text-embedding-3-small | openai ^6.34.0 | Theme vectors for semantic change detection |
| Persistence (local) | better-sqlite3 | ^12.9.0 | SQLite for local development |
| Persistence (prod) | @vercel/kv (Upstash) | ^3.0.0 | Serverless key-value store on Vercel |
| Concurrency | p-limit | ^7.3.0 | Scraping concurrency control |
| Validation | zod | ^4.3.6 | Request schema validation + SSRF protection |
| Streaming | Server-Sent Events (SSE) | — | Per-stage progress updates to the browser |
| Deployment | Vercel | — | Serverless hosting with KV integration |

---

## AI Tools / Models / Libraries Used

| Tool | Version | Role in the system |
|---|---|---|
| **OpenAI GPT-4o** | — | Analyzer: generates the full market intelligence report (themes, insights, competitor activities) using Chain-of-Thought reasoning with a role-specific perspective injected into the prompt |
| **OpenAI GPT-4o-mini** | — | Judge: independently verifies every claim extracted from the report using Chain of Verification — formulates a precise question and locates a verbatim answer in the source text before ruling |
| **OpenAI text-embedding-3-small** | — | Generates 1536-dimension embeddings for each discovered theme; used to compute cosine similarity between current and prior-run theme vectors for L3 semantic drift detection |
| **openai (Python SDK equivalent — JS)** | ^6.34.0 | Official OpenAI Node.js SDK used for all three API calls above |
| **axios** | ^1.15.0 | HTTP client for fetching source URLs; configured with browser-like headers to avoid bot-detection blocks on production servers |
| **cheerio** | ^1.2.0 | Server-side HTML parsing; type-specific CSS selectors extract content from blog, announcement, and article page layouts |
| **p-limit** | ^7.3.0 | Limits concurrent scrape requests to 3 to avoid rate limiting |
| **better-sqlite3** | ^12.9.0 | Synchronous SQLite driver for local run persistence |
| **@vercel/kv** | ^3.0.0 | Upstash Redis REST client used in production for persistent run history and change detection baselines |
| **zod** | ^4.3.6 | Schema validation on the API route; enforces HTTPS-only URLs and blocks private IP ranges (SSRF protection) |
| **uuid** | ^13.0.0 | Generates unique run IDs |

---

## Local Build & Run

**Prerequisites:** Node.js 18+, an OpenAI API key

```bash
git clone https://github.com/ridhi-0912/market-intel.git
cd market-intel
npm install
```

Create a `.env.local` file:

```
OPENAI_API_KEY=sk-...
```

```bash
npm run dev
# Open http://localhost:3000
```

Run history is stored in `db/runs.db` (SQLite, created automatically on first run).

---

## Production Deploy (Vercel)

```bash
npm i -g vercel
vercel                        # creates project, links repo
vercel env add OPENAI_API_KEY # paste your key when prompted
vercel --prod
```

**Persistent run history** requires a Vercel KV (Upstash) store:

1. In the Vercel dashboard → Storage → Create → KV
2. Link the store to your project
3. Vercel automatically injects `kv_KV_REST_API_URL` and `kv_KV_REST_API_TOKEN`
   into the environment — no manual configuration needed

Without KV, the app falls back to SQLite on `/tmp` (ephemeral per cold start —
analysis works, but history does not persist across serverless invocations).
