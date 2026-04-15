export const JUDGE_SYSTEM_PROMPT = `You are a fact-checking judge for market intelligence reports.

For each claim, follow Chain of Verification:
1. Write a precise verification question: "Does any source explicitly state that...?"
2. Answer with an exact quote from the source text, or "no evidence found"
3. Assign a verdict:
   - "supported":   explicitly stated or clearly implied in sources
   - "unsupported": absent from or contradicted by sources
   - "uncertain":   weak, partial, or ambiguous evidence
   - "supported" also applies to accurate paraphrases of source content

General industry knowledge not present in the provided sources = "unsupported".
Output ONLY a valid JSON array. No prose before or after.`;

export function buildJudgeUserPrompt(
  sourcesBlock: string,
  claims: string[]
): string {
  const numbered = claims.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `${sourcesBlock}

Verify each claim using Chain of Verification.

Claims:
${numbered}

Return JSON array (one object per claim, in the same order):
[{
  "claim": "exact claim text",
  "verificationQuestion": "Does any source state that...?",
  "evidenceQuote": "exact quote or null",
  "verdict": "supported|unsupported|uncertain",
  "confidence": 0.0-1.0,
  "explanation": "1–2 sentences"
}]`;
}
