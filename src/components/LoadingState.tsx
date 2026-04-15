"use client";

import type { SSEStage } from "../lib/types";

interface Props {
  currentStage: SSEStage;
  message: string;
}

const STAGES: { key: SSEStage; label: string }[] = [
  { key: "scraping", label: "Scraping URLs" },
  { key: "analyzing", label: "Analyzing with AI" },
  { key: "judging", label: "Verifying claims" },
  { key: "detecting_changes", label: "Detecting changes" },
  { key: "complete", label: "Done" },
];

export default function LoadingState({ currentStage, message }: Props) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const isActive = stage.key === currentStage;
          const isDone = i < currentIdx || currentStage === "complete";
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-blue-500 text-white animate-pulse"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${isActive ? "text-gray-900 font-medium" : isDone ? "text-gray-500" : "text-gray-400"}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      {message && currentStage !== "complete" && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}
