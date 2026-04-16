"use client";

import type { ScrapeResult } from "../lib/types";

interface Props {
  sources: ScrapeResult[];
}

export default function SourceList({ sources }: Props) {
  const total = sources.length;
  const processed = sources.filter((s) => !s.error).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Sources</h2>
        <span className={`text-sm font-medium ${processed < total ? "text-amber-600" : "text-green-600"}`}>
          {processed} of {total} processed
        </span>
      </div>
      <ul className="space-y-2">
        {sources.map((s) => (
          <li key={s.url} className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full shrink-0 ${s.error ? "bg-red-500" : "bg-green-500"}`} />
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate flex-1"
            >
              {s.title || s.url}
            </a>
            <span className={`text-xs px-2 py-0.5 rounded-full ${s.error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {s.error ? "failed" : "ok"}
            </span>
            <span className="text-xs text-gray-400">{s.sourceType}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
