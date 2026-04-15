import { getOpenAIClient, JUDGE_MODEL } from "./llm";
import { JUDGE_SYSTEM_PROMPT, buildJudgeUserPrompt } from "../prompts/judge";
import { buildSourcesBlock } from "../prompts/analyzer";
import type {
  ScrapeResult,
  Theme,
  CompetitorActivity,
  HallucinationCheckResult,
  FlaggedClaim,
} from "./types";

interface JudgeVerdict {
  claim: string;
  verificationQuestion: string;
  evidenceQuote: string | null;
  verdict: "supported" | "unsupported" | "uncertain";
  confidence: number;
  explanation: string;
}

export async function judge(
  sources: ScrapeResult[],
  themes: Theme[],
  activities: CompetitorActivity[]
): Promise<HallucinationCheckResult> {
  const claims: string[] = [];
  for (const theme of themes) {
    for (const insight of theme.insights) {
      claims.push(insight.text);
    }
  }
  for (const activity of activities) {
    claims.push(activity.description);
  }

  if (claims.length === 0) {
    return {
      overallConfidence: 1,
      totalClaims: 0,
      supportedCount: 0,
      flaggedClaims: [],
      verdict: "clean",
    };
  }

  const client = getOpenAIClient();
  const sourcesBlock = buildSourcesBlock(sources);
  const userPrompt = buildJudgeUserPrompt(sourcesBlock, claims);

  let verdicts: JudgeVerdict[];
  try {
    const response = await client.chat.completions.create({
      model: JUDGE_MODEL,
      max_tokens: 2048,
      temperature: 0,
      messages: [
        { role: "system", content: JUDGE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    verdicts = JSON.parse(cleaned);
  } catch {
    // Fallback: mark all claims as uncertain
    verdicts = claims.map((c) => ({
      claim: c,
      verificationQuestion: "",
      evidenceQuote: null,
      verdict: "uncertain" as const,
      confidence: 0.5,
      explanation: "Judge returned invalid response; marked uncertain by default.",
    }));
  }

  const flaggedClaims: FlaggedClaim[] = verdicts
    .filter((v) => v.verdict !== "supported")
    .map((v) => ({
      claim: v.claim,
      verificationQuestion: v.verificationQuestion,
      verdict: v.verdict as "unsupported" | "uncertain",
      confidence: v.confidence,
      evidenceQuote: v.evidenceQuote,
      explanation: v.explanation,
    }));

  const supportedCount = verdicts.filter((v) => v.verdict === "supported").length;
  const avgConfidence =
    verdicts.reduce((sum, v) => sum + v.confidence, 0) / verdicts.length;

  return {
    overallConfidence: Math.round(avgConfidence * 100) / 100,
    totalClaims: claims.length,
    supportedCount,
    flaggedClaims,
    verdict: flaggedClaims.some((f) => f.verdict === "unsupported")
      ? "has_issues"
      : "clean",
  };
}
