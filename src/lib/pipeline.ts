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

  try {
    // Stage 1: Scraping
    emit({ stage: "scraping", message: `Scraping ${request.urls.length} URLs...` });
    const scrapeResults = await scrapeUrls(request.urls);
    const validSources = scrapeResults.filter((r) => !r.error);

    if (validSources.length === 0) {
      emit({ stage: "error", message: "All URLs failed to scrape. Cannot proceed." });
      return;
    }

    // Stage 2: Analyzing
    emit({ stage: "analyzing", message: `Analyzing ${validSources.length} sources with GPT-4o...` });
    const { themes, competitorActivities } = await analyze(
      scrapeResults,
      request.competitors,
      request.role
    );

    // Stage 3: Judging
    emit({ stage: "judging", message: "Verifying claims for hallucinations..." });
    const hallucinationCheck = await judge(scrapeResults, themes, competitorActivities);

    // Stage 4: Change Detection
    emit({ stage: "detecting_changes", message: "Checking for changes from prior runs..." });
    const sortedUrls = [...request.urls].sort();
    const urlsHash = sha256(sortedUrls.join("|"));
    const priorRun = db.getLatestRunForUrlsHash(urlsHash) as RunRecord | undefined;
    const { changeDetection, themeVecs } = await detectChanges(
      scrapeResults,
      themes,
      priorRun
    );

    // Build report
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

    // Stage 5: Persist
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

    emit({ stage: "complete", runId, report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Pipeline failed";
    emit({ stage: "error", message });
  }
}
