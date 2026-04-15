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
      <div className="flex items-start gap-2 mb-2">
        <h3 className="text-base font-semibold text-gray-900">{theme.title}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${CLUSTER_COLORS[theme.clusterLabel] ?? CLUSTER_COLORS.Other}`}>
          {theme.clusterLabel}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{theme.summary}</p>
      <ul className="space-y-2">
        {theme.insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-gray-800 flex-1">{insight.text}</span>
            <a
              href={insight.sourceRef}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-blue-600 hover:underline max-w-[200px] truncate"
              title={insight.sourceRef}
            >
              {new URL(insight.sourceRef).hostname}
            </a>
            <HallucinationBadge verdict={getVerdict(insight.text, flaggedClaims)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
