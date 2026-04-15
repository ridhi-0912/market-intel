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

export async function analyze(
  sources: ScrapeResult[],
  competitors: string[],
  role?: RoleType | null
): Promise<AnalyzerResult> {
  const client = getOpenAIClient();
  const sourcesBlock = buildSourcesBlock(sources);
  const userPrompt = buildAnalyzerUserPrompt(sourcesBlock, competitors, role);

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

    // Strip scratchpad
    delete parsed.scratchpad;

    return {
      themes: parsed.themes ?? [],
      competitorActivities: parsed.competitorActivities ?? [],
    };
  };

  try {
    return await tryParse(false);
  } catch {
    return await tryParse(true);
  }
}
