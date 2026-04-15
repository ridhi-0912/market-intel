"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RunSummary {
  runId: string;
  createdAt: string;
  competitors: string[];
  urlCount: number;
  role: string | null;
}

export default function RunHistoryList() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/runs")
      .then((r) => r.json())
      .then((data) => setRuns(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading history...</p>;
  if (runs.length === 0) return <p className="text-sm text-gray-500">No runs yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Competitors</th>
            <th className="py-2 pr-4">URLs</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.runId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 pr-4 text-gray-600">
                {new Date(run.createdAt).toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-gray-800">{run.competitors.join(", ")}</td>
              <td className="py-2 pr-4 text-gray-600">{run.urlCount}</td>
              <td className="py-2 pr-4 text-gray-600">{run.role ?? "—"}</td>
              <td className="py-2">
                <Link href={`/results/${run.runId}`} className="text-blue-600 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
