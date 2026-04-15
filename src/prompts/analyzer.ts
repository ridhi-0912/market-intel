import type { ScrapeResult, RoleType } from "../lib/types";

const ROLE_DEFINITIONS: Record<RoleType, string> = {
  pm: "Product Manager — prioritize feature gaps, product parity, user-facing changes, API capabilities, and pricing implications. Frame every theme and insight in terms of roadmap impact and competitive feature positioning.",
  exec: "Executive — prioritize market momentum, strategic threats, funding signals, M&A activity, and business-level positioning. Frame every theme and insight in terms of competitive risk, market share, and strategic opportunity.",
  sales: "Sales / BD — prioritize competitive differentiators, win/loss factors, objection-handling material, and upsell opportunities. Frame every theme and insight in terms of how it affects customer conversations and deal outcomes.",
  eng: "Engineering Lead — prioritize technical architecture choices, API changes, infrastructure shifts, integration complexity, and developer tooling. Frame every theme and insight in terms of technical risk, build-vs-buy decisions, and implementation considerations.",
};

export const ANALYZER_SYSTEM_PROMPT = `You are a market intelligence analyst. Read scraped web content from competitor and industry sources and produce a structured JSON report.

Rules:
- ONLY report information explicitly stated or clearly implied in the provided sources.
- Every insight MUST include the exact URL it came from as sourceRef.
- Use the scratchpad to list raw facts before grouping into themes.
- Assign each theme a clusterLabel from exactly: Product, Pricing, Partnerships, Growth, M&A, Engineering, Other.
- When a role perspective is provided, filter and frame ALL themes, insights, and competitor activities through that lens. Only surface what is relevant and actionable for that audience.
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
  }]
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
  competitors: string[],
  role?: RoleType | null
): string {
  const perspectiveLine = role
    ? `Perspective: ${ROLE_DEFINITIONS[role]}\nGenerate the entire report from this perspective — filter, prioritize, and frame all themes, insights, and competitor activities to be most relevant and actionable for this audience.`
    : "Perspective: Balanced — cover all relevant themes and activities without filtering for a specific audience.";

  return `${sourcesBlock}

Analyze the above sources for these competitors/topics: ${competitors.join(", ")}

${perspectiveLine}

Step 1 — scratchpad: For each source, list every distinct factual claim, tagged by URL.
Step 2 — themes: Group claims into 3–7 themes relevant to the perspective above. Each insight must have its exact sourceRef URL.
          Assign a clusterLabel (Product / Pricing / Partnerships / Growth / M&A / Engineering / Other).
Step 3 — activities: List every significant competitor activity relevant to the perspective above, with its source URL(s).

Output the JSON schema shown in the example. Include scratchpad in output — it will be stripped server-side.`;
}
