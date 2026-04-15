"use client";

import type { Theme, FlaggedClaim } from "../lib/types";
import ThemeCard from "./ThemeCard";

interface Props {
  themes: Theme[];
  flaggedClaims: FlaggedClaim[];
}

export default function ThemeClusterGroup({ themes, flaggedClaims }: Props) {
  const groups = new Map<string, Theme[]>();
  for (const theme of themes) {
    const label = theme.clusterLabel;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(theme);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([label, groupThemes]) => (
        <div key={label}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {label}
          </h2>
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
