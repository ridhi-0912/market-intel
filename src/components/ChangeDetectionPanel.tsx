"use client";

import type { ChangeDetectionResult } from "../lib/types";

interface Props {
  changes: ChangeDetectionResult;
}

export default function ChangeDetectionPanel({ changes }: Props) {
  const hasChanges =
    changes.changedSourceUrls.length > 0 ||
    changes.newThemes.length > 0 ||
    changes.removedThemes.length > 0 ||
    changes.evolvedThemes.length > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Change Detection</h2>
        <span className="text-xs text-gray-400">
          vs. run from {new Date(changes.previousRunAt).toLocaleDateString()} {new Date(changes.previousRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {!hasChanges && (
        <p className="text-sm text-gray-500">No changes detected since the previous run.</p>
      )}

      {changes.changedSourceUrls.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
            Updated Sources ({changes.changedSourceUrls.length})
          </p>
          <ul className="space-y-1">
            {changes.changedSourceUrls.map((url) => (
              <li key={url} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {changes.newThemes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
            New Themes ({changes.newThemes.length})
          </p>
          <ul className="space-y-1">
            {changes.newThemes.map((t) => (
              <li key={t} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {changes.removedThemes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
            Removed Themes ({changes.removedThemes.length})
          </p>
          <ul className="space-y-1">
            {changes.removedThemes.map((t) => (
              <li key={t} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {changes.evolvedThemes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
            Evolved Themes ({changes.evolvedThemes.length})
          </p>
          <div className="space-y-3">
            {changes.evolvedThemes.map((t) => (
              <div key={t.themeId} className="rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{t.title}</span>
                  <span className="text-xs text-blue-600 font-medium">{Math.round(t.similarityScore * 100)}% similar</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Before</p>
                    <p className="text-xs text-gray-600">{t.priorSummary}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Now</p>
                    <p className="text-xs text-gray-600">{t.currentSummary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
