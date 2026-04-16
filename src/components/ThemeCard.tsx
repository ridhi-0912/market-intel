"use client";

import type { Theme, FlaggedClaim } from "../lib/types";
import HallucinationBadge from "./HallucinationBadge";

interface Props {
  theme: Theme;
  flaggedClaims: FlaggedClaim[];
}

function getVerdict(text: string, flagged: FlaggedClaim[]): "supported" | "unsupported" | "uncertain" {
  const match = flagged.find((f) => f.claim === text);
  return match ? match.verdict : "supported";
}

const CLUSTER_COLORS: Record<string, string> = {
  Product: "bg-blue-100 text-blue-700",
  Pricing: "bg-purple-100 text-purple-700",
  Partnerships: "bg-teal-100 text-teal-700",
  Growth: "bg-green-100 text-green-700",
  "M&A": "bg-orange-100 text-orange-700",
  Engineering: "bg-indigo-100 text-indigo-700",
  Other: "bg-gray-100 text-gray-700",
};

export default function ThemeCard({ theme, flaggedClaims }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-2 mb-3">
        <h3 className="text-base font-semibold text-gray-900 flex-1">{theme.title}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${CLUSTER_COLORS[theme.clusterLabel] ?? CLUSTER_COLORS.Other}`}>
          {theme.clusterLabel}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Summary</p>
        <p className="text-sm text-gray-600 leading-relaxed">{theme.summary}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Key Insights <span className="normal-case font-normal text-gray-400">— each traced to its source</span>
        </p>
        <ul className="space-y-2">
          {theme.insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm border-l-2 border-gray-100 pl-3">
              <span className="text-gray-800 flex-1 leading-snug">{insight.text}</span>
              <a
                href={insight.sourceRef}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-blue-500 hover:underline max-w-[160px] truncate"
                title={insight.sourceRef}
              >
                {new URL(insight.sourceRef).hostname}
              </a>
              <HallucinationBadge verdict={getVerdict(insight.text, flaggedClaims)} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
