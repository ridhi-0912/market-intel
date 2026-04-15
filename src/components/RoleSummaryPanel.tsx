"use client";

import { useState } from "react";
import type { RoleSummaries, RoleType } from "../lib/types";

interface Props {
  summaries: RoleSummaries;
  defaultRole: RoleType | null;
}

const TABS: { key: RoleType; label: string }[] = [
  { key: "pm", label: "PM" },
  { key: "exec", label: "Exec" },
  { key: "sales", label: "Sales" },
  { key: "eng", label: "Eng" },
];

export default function RoleSummaryPanel({ summaries, defaultRole }: Props) {
  const [active, setActive] = useState<RoleType>(defaultRole ?? "pm");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Executive Summary</h2>
        <div className="ml-auto flex rounded-md border border-gray-300 overflow-hidden text-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-3 py-1 transition-colors ${
                active === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {summaries[active] || "No summary available for this perspective."}
      </p>
    </div>
  );
}
