"use client";

import type { ScrapeResult, ChangeDetectionResult } from "../lib/types";

interface Props {
  sources: ScrapeResult[];
  changeDetection: ChangeDetectionResult | null;
}

export default function SourceList({ sources, changeDetection }: Props) {
  const changedUrls = new Set(changeDetection?.changedSourceUrls ?? []);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Sources</h2>
      <ul className="space-y-2">
        {sources.map((s) => (
          <li key={s.url} className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                s.error ? "bg-red-500" : changedUrls.has(s.url) ? "bg-amber-500" : "bg-green-500"
              }`}
            />
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate flex-1"
            >
              {s.title || s.url}
            </a>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              s.error
                ? "bg-red-100 text-red-700"
                : changedUrls.has(s.url)
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
            }`}>
              {s.error ? "failed" : changedUrls.has(s.url) ? "changed" : "ok"}
            </span>
            <span className="text-xs text-gray-400">{s.sourceType}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
