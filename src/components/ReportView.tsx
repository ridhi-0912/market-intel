"use client";

import type { MarketIntelligenceReport } from "../lib/types";
import RoleSummaryPanel from "./RoleSummaryPanel";
import ChangeDetectionPanel from "./ChangeDetectionPanel";
import ThemeClusterGroup from "./ThemeClusterGroup";
import CompetitorCard from "./CompetitorCard";
import SourceList from "./SourceList";

interface Props {
  report: MarketIntelligenceReport;
}

export default function ReportView({ report }: Props) {
  const { hallucinationCheck } = report;

  return (
    <div className="space-y-6">
      {/* 1. Role Summary */}
      <RoleSummaryPanel summaries={report.roleSummaries} defaultRole={report.role} />

      {/* 2. Change Detection */}
      {report.changeDetection && (
        <ChangeDetectionPanel changes={report.changeDetection} />
      )}

      {/* 3. Themes grouped by cluster */}
      <ThemeClusterGroup
        themes={report.themes}
        flaggedClaims={hallucinationCheck.flaggedClaims}
      />

      {/* 4. Competitor Activities */}
      {report.competitorActivities.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Competitor Activities
          </h2>
          <div className="space-y-3">
            {report.competitorActivities.map((a, i) => (
              <CompetitorCard
                key={i}
                activity={a}
                flaggedClaims={hallucinationCheck.flaggedClaims}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Sources */}
      <SourceList
        sources={report.sourcesAnalyzed}
        changeDetection={report.changeDetection}
      />

      {/* 6. Hallucination Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification Summary</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            Confidence: <span className="font-semibold">{Math.round(hallucinationCheck.overallConfidence * 100)}%</span>
          </span>
          <span className="text-gray-600">
            Claims: <span className="font-semibold">{hallucinationCheck.supportedCount}/{hallucinationCheck.totalClaims}</span> supported
          </span>
          {hallucinationCheck.flaggedClaims.length > 0 && (
            <span className="text-amber-600 font-medium">
              {hallucinationCheck.flaggedClaims.length} flagged
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
