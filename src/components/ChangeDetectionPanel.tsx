"use client";

import type { ChangeDetectionResult } from "../lib/types";

interface Props {
  changes: ChangeDetectionResult;
}

export default function ChangeDetectionPanel({ changes }: Props) {
  const hasChanges =
    changes.newThemes.length > 0 ||
    changes.removedThemes.length > 0 ||
    changes.evolvedThemes.length > 0 ||
    changes.changedSourceUrls.length > 0;

  if (!hasChanges) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Change Detection</h2>
        <p className="text-sm text-gray-500">No significant changes since the previous run.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Changes since {new Date(changes.previousRunAt).toLocaleDateString()}
      </h2>

      {changes.newThemes.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-green-700 mb-1">New Themes</h3>
          <ul className="space-y-1">
            {changes.newThemes.map((t) => (
              <li key={t} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {changes.evolvedThemes.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-amber-700 mb-1">Evolved Themes</h3>
          {changes.evolvedThemes.map((et) => (
            <div key={et.themeId} className="mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-medium text-gray-800">{et.title}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(et.similarityScore * 100)}% similar)
                </span>
              </div>
              <div className="ml-4 mt-1 text-xs text-gray-500">
                <div>Before: {et.priorSummary}</div>
                <div>Now: {et.currentSummary}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {changes.removedThemes.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Removed Themes</h3>
          <ul className="space-y-1">
            {changes.removedThemes.map((t) => (
              <li key={t} className="text-sm text-gray-400 flex items-center gap-2 line-through">
                <span className="w-2 h-2 rounded-full bg-gray-400" /> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {changes.changedSourceUrls.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-blue-700 mb-1">Changed Sources</h3>
          <ul className="space-y-1">
            {changes.changedSourceUrls.map((url) => (
              <li key={url} className="text-sm text-blue-600 truncate">{url}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
