import type { ScrapeResult, RoleType } from "../lib/types";

const ROLE_DEFINITIONS: Record<RoleType, string> = {
  pm: `Product Manager
Your job is to produce a report that directly informs roadmap decisions and competitive positioning.

Focus on:
- Feature-by-feature comparisons: what competitors have shipped that you have not, and vice versa
- Product gaps and parity: where competitors are ahead, behind, or moving fast
- User-facing changes: UX improvements, workflow changes, pricing model shifts that affect adoption
- API and platform capabilities: new integrations, SDKs, developer-facing changes that signal platform strategy
- Signals for your roadmap: what competitor bets suggest about where the market is going

Frame every theme as a strategic product question: "Should we build this? Is this a gap we need to close? Is this a bet worth making?"
Every insight should answer: "What does this mean for our product?"`,

  exec: `Executive
Your job is to produce a report that informs strategic decisions at the business level.

Focus on:
- Competitive momentum: who is accelerating, who is losing ground, and why
- Strategic threats: moves that could erode market share, pricing power, or customer relationships
- Market positioning: how competitors are repositioning and what narrative they are pushing
- Funding, M&A, and partnership signals: capital allocation and consolidation moves
- Risks and opportunities: what requires a response, and what creates a window to act

Frame every theme as a business-level question: "Does this change our competitive risk? Does this change the market we are competing in?"
Every insight should answer: "What does this mean for our competitive position?"`,

  sales: `Sales / Business Development
Your job is to produce a report that directly arms the sales team in competitive deals.

Focus on:
- Specific differentiators: concrete capabilities we have that competitors do not, and vice versa
- Objection-handling material: competitor claims that come up in deals and how to counter them
- Pricing and packaging changes: new tiers, discounts, or bundling that affect deal economics
- Win/loss signals: what competitor moves suggest about where we win and where we lose
- Customer-facing messaging: how competitors are positioning themselves to customers, and what that means for our pitch

Frame every theme as a deal question: "How does this change the conversation with a prospect?"
Every insight should answer: "What do I say when a prospect brings this up?"`,

  eng: `Engineering Lead
Your job is to produce a report that informs technical strategy and architecture decisions.

Focus on:
- Architecture and infrastructure choices: serverless, edge, microservices, monolith — what competitors are betting on
- API design and breaking changes: versioning strategies, deprecations, new endpoints that affect integrations
- Developer experience: SDK quality, documentation, local development tooling, onboarding friction
- Build vs buy signals: what competitors are building internally vs sourcing from third parties
- Security, compliance, and reliability: certifications, incident reports, SLA changes, data residency decisions
- Open source activity: repos being published, contributions, or community investments

Frame every theme as a technical decision: "Does this change how we build? Does this create integration risk or opportunity?"
Every insight should answer: "What does an engineer need to know about this?"`,
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

Step 1 — scratchpad: For each source URL, list every distinct factual claim found, tagged with its URL.

Step 2 — themes (topic clustering): Identify 3–7 themes that cut across ALL competitors and sources.
  CRITICAL CLUSTERING RULES:
  - Themes MUST be organized by TOPIC, not by competitor. Do NOT create one theme per competitor.
  - If multiple competitors have activity in the same area (e.g. pricing changes, API launches, hiring), those insights MUST be grouped into a single shared theme.
  - A theme about "API Expansion" should contain insights from Stripe AND Plaid if both are expanding APIs.
  - Each insight must carry its exact sourceRef URL.
  - Assign each theme a clusterLabel: Product / Pricing / Partnerships / Growth / M&A / Engineering / Other.

Step 3 — activities: List each significant competitor action with its type, date (if mentioned), and source URL(s).

Output the JSON schema shown in the example. Include scratchpad in output — it will be stripped server-side.`;
}
