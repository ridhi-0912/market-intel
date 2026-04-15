import type { ScrapeResult } from "../lib/types";

export const ANALYZER_SYSTEM_PROMPT = `You are a market intelligence analyst. Read scraped web content from competitor and industry sources and produce a structured JSON report.

Rules:
- ONLY report information explicitly stated or clearly implied in the provided sources.
- Every insight MUST include the exact URL it came from as sourceRef.
- Use the scratchpad to list raw facts before grouping into themes.
- Assign each theme a clusterLabel from exactly: Product, Pricing, Partnerships, Growth, M&A, Engineering, Other.
- Output ONLY valid JSON. No prose before or after.

<example>
{
  "scratchpad": "stripe.com/newsroom: Stripe Tax API v2 launched Q1 2025, supports 40+ countries. No pricing info found...",
  "themes": [{
    "id": "t1",
    "title": "Embedded Tax Compliance",
    "summary": "Stripe launched Tax API v2 enabling real-time multi-jurisdiction compliance for platforms.",
    "insights": [
      { "text": "Stripe Tax API v2 launched Q1 2025", "sourceRef": "https://stripe.com/newsroom" },
      { "text": "Supports compliance in 40+ countries", "sourceRef": "https://stripe.com/newsroom" }
    ],
    "clusterLabel": "Product"
  }],
  "competitorActivities": [{
    "competitor": "Stripe",
    "activityType": "product_launch",
    "description": "Launched Tax API v2 with real-time compliance checking across 40+ countries",
    "sourceRefs": ["https://stripe.com/newsroom"],
    "dateMentioned": "Q1 2025"
  }],
  "roleSummaries": {
    "pm": "Stripe's Tax API v2 closes a product gap in multi-jurisdiction compliance for platforms...",
    "exec": "Stripe is accelerating embedded financial infrastructure with compliance tooling that increases platform lock-in...",
    "sales": "Tax API v2 opens upsell opportunities for platforms needing multi-jurisdiction compliance...",
    "eng": "Tax API v2 introduces real-time compliance checking that may require integration changes for existing platform clients..."
  }
}
</example>`;

export function buildSourcesBlock(sources: ScrapeResult[]): string {
  const valid = sources.filter((s) => !s.error);
  return `<sources>\n${valid
    .map((s) => `  <source url="${s.url}" title="${s.title}">${s.content}</source>`)
    .join("\n")}\n</sources>`;
}

export function buildAnalyzerUserPrompt(
  sourcesBlock: string,
  competitors: string[]
): string {
  return `${sourcesBlock}

Analyze the above sources for these competitors/topics: ${competitors.join(", ")}

Step 1 — scratchpad: For each source, list every distinct factual claim, tagged by URL.
Step 2 — themes: Group claims into 3–7 themes. Each insight must have its exact sourceRef URL.
          Assign a clusterLabel (Product / Pricing / Partnerships / Growth / M&A / Engineering / Other).
Step 3 — activities: List every significant competitor activity with its source URL(s).
Step 4 — role summaries:
  pm:    3–4 sentences on feature gaps, product parity, user-facing changes, pricing
  exec:  2–3 sentences on market momentum, strategic threats, funding/M&A signals
  sales: 2–3 sentences on competitive positioning, win/loss implications, upsell/cross-sell opportunities
  eng:   2–3 sentences on technical architecture shifts, API changes, integration impacts, developer experience

Output the JSON schema shown in the example. Include scratchpad in output — it will be stripped server-side.`;
}
