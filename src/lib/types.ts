// --- Request ---

export interface AnalysisRequest {
  competitors: string[];
  urls: string[];
  role?: RoleType;
}

// --- Report ---

export interface MarketIntelligenceReport {
  runId: string;
  generatedAt: string;
  competitors: string[];
  role: RoleType | null;
  sourcesAnalyzed: ScrapeResult[];
  themes: Theme[];
  competitorActivities: CompetitorActivity[];
  hallucinationCheck: HallucinationCheckResult;
  changeDetection: ChangeDetectionResult | null;
}

// --- Core entities ---

export interface Insight {
  text: string;
  sourceRef: string;
}

export interface Theme {
  id: string;
  title: string;
  summary: string;
  insights: Insight[];
  clusterLabel: ClusterLabel;
}

export type ClusterLabel =
  | "Product"
  | "Pricing"
  | "Partnerships"
  | "Growth"
  | "M&A"
  | "Engineering"
  | "Other";

export interface CompetitorActivity {
  competitor: string;
  activityType: "product_launch" | "partnership" | "hiring" | "funding" | "other";
  description: string;
  sourceRefs: string[];
  dateMentioned?: string;
}

export type RoleType = "pm" | "exec" | "sales" | "eng";

// --- Hallucination check ---

export interface HallucinationCheckResult {
  overallConfidence: number;
  totalClaims: number;
  supportedCount: number;
  flaggedClaims: FlaggedClaim[];
  verdict: "clean" | "has_issues";
}

export interface FlaggedClaim {
  claim: string;
  verificationQuestion: string;
  verdict: "unsupported" | "uncertain";
  confidence: number;
  evidenceQuote: string | null;
  explanation: string;
}

// --- Scraping ---

export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  scrapedAt: string;
  sourceType: "blog" | "announcement" | "article" | "unknown";
  error?: string;
}

// --- Change detection ---

export interface ChangeDetectionResult {
  isFirstRun: false;
  previousRunId: string;
  previousRunAt: string;
  changedSourceUrls: string[];
  newThemes: string[];
  removedThemes: string[];
  evolvedThemes: EvolvedTheme[];
}

export interface EvolvedTheme {
  themeId: string;
  title: string;
  similarityScore: number;
  priorSummary: string;
  currentSummary: string;
}

// --- Persistence ---

export interface ThemeVector {
  themeId: string;
  title: string;
  summary: string;
  embedding: number[];
}

export interface RunRecord {
  runId: string;
  createdAt: string;
  urlsHash: string;
  competitors: string[];
  urls: string[];
  role: RoleType | null;
  srcHashes: Record<string, string>;
  themeVecs: ThemeVector[];
  report: MarketIntelligenceReport;
}

// --- SSE Events ---

export type SSEStage =
  | "scraping"
  | "analyzing"
  | "judging"
  | "detecting_changes"
  | "complete"
  | "error";

export interface SSEEvent {
  stage: SSEStage;
  message?: string;
  runId?: string;
  report?: MarketIntelligenceReport;
}
