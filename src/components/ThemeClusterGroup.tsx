"use client";

import type { Theme, FlaggedClaim } from "../lib/types";
import ThemeCard from "./ThemeCard";

interface Props {
  themes: Theme[];
  flaggedClaims: FlaggedClaim[];
}

export default function ThemeClusterGroup({ themes, flaggedClaims }: Props) {
  const CLUSTER_ORDER = ["Product", "Pricing", "Engineering", "Growth", "Partnerships", "M&A", "Other"];

  const groups = new Map<string, Theme[]>();
  for (const theme of themes) {
    const label = theme.clusterLabel;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(theme);
  }

  const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
    const ai = CLUSTER_ORDER.indexOf(a);
    const bi = CLUSTER_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Key Themes &amp; Trends</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Topics discovered across all sources, grouped by category. Each theme may include insights from multiple competitors.
        </p>
      </div>
      {sortedGroups.map(([label, groupThemes]) => (
        <div key={label}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="flex-1 border-t border-gray-100" />
            {label}
            <span className="flex-1 border-t border-gray-100" />
          </h3>
          <div className="space-y-3">
            {groupThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} flaggedClaims={flaggedClaims} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
