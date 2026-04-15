import { v4 as uuidv4 } from "uuid";
import { scrapeUrls, sha256 } from "./scraper";
import { analyze } from "./analyzer";
import { judge } from "./judge";
import { detectChanges } from "./change";
import { db } from "./db";
import type {
  AnalysisRequest,
  MarketIntelligenceReport,
  SSEEvent,
  RunRecord,
} from "./types";

export async function runPipeline(
  request: AnalysisRequest,
  emit: (event: SSEEvent) => void
): Promise<void> {
  const runId = uuidv4();

  // Stage 1: Scraping — hard requirement
  let scrapeResults;
  try {
    emit({ stage: "scraping", message: `Scraping ${request.urls.length} URLs...` });
    scrapeResults = await scrapeUrls(request.urls);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Scraping failed";
    emit({ stage: "error", message });
    return;
  }

  const validSources = scrapeResults.filter((r) => !r.error);
  if (validSources.length === 0) {
    emit({ stage: "error", message: "All URLs failed to scrape. Cannot proceed." });
    return;
  }

  // Stage 2: Analysis — hard requirement
  let themes, competitorActivities;
  try {
    emit({ stage: "analyzing", message: `Analyzing ${validSources.length} sources with GPT-4o...` });
    ({ themes, competitorActivities } = await analyze(
      scrapeResults,
      request.competitors,
      request.role
    ));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    emit({ stage: "error", message });
    return;
  }

  // Stage 3: Hallucination check — optional, degrades gracefully
  let hallucinationCheck: MarketIntelligenceReport["hallucinationCheck"];
  try {
    emit({ stage: "judging", message: "Verifying claims for hallucinations..." });
    hallucinationCheck = await judge(scrapeResults, themes, competitorActivities);
  } catch {
    hallucinationCheck = {
      overallConfidence: 0,
      totalClaims: 0,
      supportedCount: 0,
      flaggedClaims: [],
      verdict: "clean",
    };
  }

  // Stage 4: Change detection — optional, degrades gracefully
  const sortedUrls = [...request.urls].sort();
  const urlsHash = sha256(sortedUrls.join("|"));
  let changeDetection: MarketIntelligenceReport["changeDetection"] = null;
  let themeVecs: RunRecord["themeVecs"] = [];
  try {
    emit({ stage: "detecting_changes", message: "Checking for changes from prior runs..." });
    const priorRun = db.getLatestRunForUrlsHash(urlsHash) as RunRecord | undefined;
    ({ changeDetection, themeVecs } = await detectChanges(scrapeResults, themes, priorRun));
  } catch {
    // Non-fatal: report is still complete without change detection
  }

  // Build and emit report — guaranteed at this point
  const report: MarketIntelligenceReport = {
    runId,
    generatedAt: new Date().toISOString(),
    competitors: request.competitors,
    role: request.role ?? null,
    sourcesAnalyzed: scrapeResults,
    themes,
    competitorActivities,
    hallucinationCheck,
    changeDetection,
  };

  emit({ stage: "complete", runId, report });

  // Stage 5: Persist — fire-and-forget, never blocks the response
  try {
    const srcHashes: Record<string, string> = {};
    for (const r of scrapeResults) {
      if (!r.error) srcHashes[r.url] = sha256(r.content);
    }
    db.saveRun({
      runId,
      createdAt: report.generatedAt,
      urlsHash,
      competitors: request.competitors,
      urls: sortedUrls,
      role: request.role ?? null,
      srcHashes,
      themeVecs,
      report,
    });
  } catch {
    // Non-fatal: report already delivered to the client
  }
}
