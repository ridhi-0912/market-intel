import { sha256 } from "./scraper";
import { embedTexts, cosineSimilarity } from "./embeddings";
import type {
  ScrapeResult,
  Theme,
  RunRecord,
  ChangeDetectionResult,
  EvolvedTheme,
  ThemeVector,
} from "./types";

export async function detectChanges(
  scrapeResults: ScrapeResult[],
  themes: Theme[],
  priorRun: RunRecord | undefined
): Promise<{ changeDetection: ChangeDetectionResult | null; themeVecs: ThemeVector[] }> {
  // Generate embeddings for current themes
  const themeTexts = themes.map((t) => `${t.title}. ${t.summary}`);
  const embeddings = await embedTexts(themeTexts);
  const themeVecs: ThemeVector[] = themes.map((t, i) => ({
    themeId: t.id,
    title: t.title,
    summary: t.summary,
    embedding: embeddings?.[i] ?? [],
  }));

  if (!priorRun) {
    return { changeDetection: null, themeVecs };
  }

  // L1: content hash comparison
  const changedSourceUrls = scrapeResults
    .filter((r) => !r.error)
    .filter((r) => sha256(r.content) !== priorRun.srcHashes[r.url])
    .map((r) => r.url);

  // L2: theme title diff
  const priorTitles = new Set(priorRun.report.themes.map((t) => t.title));
  const currentTitles = new Set(themes.map((t) => t.title));
  const newThemes = [...currentTitles].filter((t) => !priorTitles.has(t));
  const removedThemes = [...priorTitles].filter((t) => !currentTitles.has(t));

  // L3: semantic drift via embeddings
  let evolvedThemes: EvolvedTheme[] = [];
  if (embeddings && priorRun.themeVecs.length > 0) {
    evolvedThemes = themeVecs.flatMap((tv) => {
      if (tv.embedding.length === 0) return [];
      let bestScore = 0;
      let bestPrior: ThemeVector | null = null;
      for (const pv of priorRun.themeVecs) {
        if (pv.embedding.length === 0) continue;
        const score = cosineSimilarity(tv.embedding, pv.embedding);
        if (score > bestScore) {
          bestScore = score;
          bestPrior = pv;
        }
      }
      if (bestScore >= 0.7 && bestScore < 0.92 && bestPrior) {
        return [{
          themeId: tv.themeId,
          title: tv.title,
          similarityScore: Math.round(bestScore * 100) / 100,
          priorSummary: bestPrior.summary,
          currentSummary: tv.summary,
        }];
      }
      return [];
    });
  }

  return {
    changeDetection: {
      isFirstRun: false,
      previousRunId: priorRun.runId,
      previousRunAt: priorRun.createdAt,
      changedSourceUrls,
      newThemes,
      removedThemes,
      evolvedThemes,
    },
    themeVecs,
  };
}
