"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface RunSummary {
  runId: string;
  createdAt: string;
  competitors: string[];
  urlCount: number;
  role: string | null;
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !loaded) {
      fetch("/api/runs")
        .then((r) => r.json())
        .then((data) => { setRuns(data); setLoaded(true); })
        .catch(() => setLoaded(true));
    }
  }, [open, loaded]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
        <a href="/" className="text-lg font-semibold text-gray-900">Market Intel</a>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            History
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Recent Runs</span>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!loaded && <p className="px-4 py-3 text-sm text-gray-500">Loading...</p>}
                {loaded && runs.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">No runs yet.</p>}
                {runs.map((run) => (
                  <Link
                    key={run.runId}
                    href={`/results/${run.runId}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                        {run.competitors.join(", ")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {run.urlCount} URL{run.urlCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {new Date(run.createdAt).toLocaleDateString()} {new Date(run.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {run.role && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{run.role.toUpperCase()}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
