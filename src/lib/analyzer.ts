import { getOpenAIClient, ANALYZER_MODEL } from "./llm";
import {
  ANALYZER_SYSTEM_PROMPT,
  buildSourcesBlock,
  buildAnalyzerUserPrompt,
} from "../prompts/analyzer";
import type { ScrapeResult, Theme, CompetitorActivity, RoleSummaries } from "./types";

export interface AnalyzerResult {
  themes: Theme[];
  competitorActivities: CompetitorActivity[];
  roleSummaries: RoleSummaries;
}

export async function analyze(
  sources: ScrapeResult[],
  competitors: string[]
): Promise<AnalyzerResult> {
  const client = getOpenAIClient();
  const sourcesBlock = buildSourcesBlock(sources);
  const userPrompt = buildAnalyzerUserPrompt(sourcesBlock, competitors);

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
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    // Strip scratchpad
    delete parsed.scratchpad;

    return {
      themes: parsed.themes ?? [],
      competitorActivities: parsed.competitorActivities ?? [],
      roleSummaries: parsed.roleSummaries ?? { pm: "", exec: "", sales: "", eng: "" },
    };
  };

  try {
    return await tryParse(false);
  } catch {
    return await tryParse(true);
  }
}
