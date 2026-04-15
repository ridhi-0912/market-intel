"use client";

import type { MarketIntelligenceReport } from "../lib/types";
import ThemeClusterGroup from "./ThemeClusterGroup";
import CompetitorCard from "./CompetitorCard";
import SourceList from "./SourceList";

interface Props {
  report: MarketIntelligenceReport;
}

const ROLE_LABELS: Record<string, string> = {
  pm: "Product Manager",
  exec: "Executive",
  sales: "Sales / BD",
  eng: "Engineering Lead",
};

export default function ReportView({ report }: Props) {
  const { hallucinationCheck } = report;

  return (
    <div className="space-y-6">
      {/* Role badge */}
      {report.role && (
        <p className="text-sm text-gray-500">
          Perspective: <span className="font-medium text-gray-700">{ROLE_LABELS[report.role]}</span>
        </p>
      )}

      {/* 1. Key Themes & Trends */}
      <ThemeClusterGroup
        themes={report.themes}
        flaggedClaims={hallucinationCheck.flaggedClaims}
      />

      {/* 2. Notable Competitor Activities */}
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

      {/* 3. Source References */}
      <SourceList sources={report.sourcesAnalyzed} />

      {/* 4. Hallucination Verification */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Claim Verification</h2>
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
        {hallucinationCheck.flaggedClaims.length > 0 && (
          <ul className="mt-3 space-y-2">
            {hallucinationCheck.flaggedClaims.map((f, i) => (
              <li key={i} className="text-sm border-l-2 border-amber-400 pl-3">
                <p className="text-gray-800">{f.claim}</p>
                <p className="text-gray-500 mt-0.5">{f.explanation}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
