import { getOpenAIClient, ANALYZER_MODEL } from "./llm";
import {
  ANALYZER_SYSTEM_PROMPT,
  buildSourcesBlock,
  buildAnalyzerUserPrompt,
} from "../prompts/analyzer";
import type { ScrapeResult, Theme, CompetitorActivity, RoleType } from "./types";

export interface AnalyzerResult {
  themes: Theme[];
  competitorActivities: CompetitorActivity[];
}

function computeCoverage(
  competitors: string[],
  sources: ScrapeResult[]
): Record<string, boolean> {
  const valid = sources.filter((s) => !s.error);
  return Object.fromEntries(
    competitors.map((c) => {
      const term = c.toLowerCase();
      const found = valid.some(
        (s) =>
          s.url.toLowerCase().includes(term) ||
          s.content.toLowerCase().includes(term)
      );
      return [c, found];
    })
  );
}

export async function analyze(
  sources: ScrapeResult[],
  competitors: string[],
  role?: RoleType | null
): Promise<AnalyzerResult> {
  const client = getOpenAIClient();

  // Coverage determined server-side — never delegated to the LLM
  const coverageMap = computeCoverage(competitors, sources);

  const sourcesBlock = buildSourcesBlock(sources);
  const userPrompt = buildAnalyzerUserPrompt(sourcesBlock, competitors, coverageMap, role);

  const tryParse = async (retry: boolean): Promise<AnalyzerResult> => {
    const prompt = retry ? userPrompt + "\n\nOutput ONLY valid JSON." : userPrompt;
    const response = await client.chat.completions.create({
      model: ANALYZER_MODEL,
      max_tokens: 4096,
      temperature: 0.4,
      messages: [
        { role: "system", content: ANALYZER_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    delete parsed.scratchpad;

    return {
      themes: parsed.themes ?? [],
      competitorActivities: parsed.competitorActivities ?? [],
    };
  };

  let themes: Theme[];
  let competitorActivities: CompetitorActivity[];

  try {
    ({ themes, competitorActivities } = await tryParse(false));
  } catch {
    ({ themes, competitorActivities } = await tryParse(true));
  }

  // Inject "No Coverage Found" theme server-side for any competitor the LLM
  // was told to skip — deterministic, never subject to LLM inconsistency
  const missing = competitors.filter((c) => !coverageMap[c]);
  if (missing.length > 0) {
    themes.push({
      id: "no-coverage",
      title: "No Coverage Found",
      summary: `The following requested competitors were not mentioned in any of the provided sources: ${missing.join(", ")}.`,
      insights: missing.map((c) => ({
        text: `No information found for ${c} in the provided sources.`,
        sourceRef: "",
      })),
      clusterLabel: "Other",
    });
  }

  return { themes, competitorActivities };
}
