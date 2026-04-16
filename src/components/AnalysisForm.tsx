"use client";

import { useState, useCallback, type FormEvent } from "react";
import type { MarketIntelligenceReport, SSEEvent, SSEStage, RoleType } from "../lib/types";
import LoadingState from "./LoadingState";
import ReportView from "./ReportView";

const ROLE_OPTIONS: { value: RoleType | ""; label: string }[] = [
  { value: "", label: "All Perspectives" },
  { value: "pm", label: "Product Manager" },
  { value: "exec", label: "Executive" },
  { value: "sales", label: "Sales / BD" },
  { value: "eng", label: "Engineering Lead" },
];

export default function AnalysisForm() {
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<Record<number, string>>({});
  const [role, setRole] = useState<RoleType | "">("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<SSEStage>("scraping");
  const [stageMessage, setStageMessage] = useState("");
  const [report, setReport] = useState<MarketIntelligenceReport | null>(null);
  const [error, setError] = useState("");

  const validateUrl = (value: string): string => {
    if (!value.trim()) return "";
    if (!value.startsWith("https://")) return "URL must start with https://";
    try {
      const parsed = new URL(value);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
        return "Local URLs are not allowed";
      return "";
    } catch {
      return "Invalid URL format";
    }
  };

  const addCompetitor = useCallback(() => {
    const val = competitorInput.trim();
    if (val && !competitors.includes(val)) {
      setCompetitors((prev) => [...prev, val]);
      setCompetitorInput("");
    }
  }, [competitorInput, competitors]);

  const removeCompetitor = (idx: number) =>
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));

  const updateUrl = (idx: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === idx ? value : u)));
    const err = validateUrl(value);
    setUrlErrors((prev) => ({ ...prev, [idx]: err }));
  };

  const addUrl = () => setUrls((prev) => [...prev, ""]);
  const removeUrl = (idx: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== idx));
    setUrlErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const n = parseInt(k);
        if (n < idx) next[n] = v;
        else if (n > idx) next[n - 1] = v;
      });
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setReport(null);
    setLoading(true);
    setStage("scraping");
    setStageMessage("Starting...");

    const validUrls = urls.filter((u) => u.trim());
    if (competitors.length === 0 || validUrls.length === 0) {
      setError("Please add at least one competitor and one URL.");
      setLoading(false);
      return;
    }
    const newErrors: Record<number, string> = {};
    validUrls.forEach((u, i) => { const e = validateUrl(u); if (e) newErrors[i] = e; });
    if (Object.keys(newErrors).length > 0) {
      setUrlErrors(newErrors);
      setError("Please fix the invalid URLs before analyzing.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitors,
          urls: validUrls,
          ...(role ? { role } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ? JSON.stringify(data.error) : "Request failed");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const dataLine = line.replace(/^data: /, "").trim();
          if (!dataLine) continue;
          try {
            const event: SSEEvent = JSON.parse(dataLine);
            setStage(event.stage);
            if (event.message) setStageMessage(event.message);
            if (event.stage === "complete" && event.report) setReport(event.report);
            if (event.stage === "error") setError(event.message || "Pipeline failed");
          } catch {
            // skip malformed SSE
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (report) {
    return (
      <div>
        <button
          onClick={() => { setReport(null); setError(""); }}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← New Analysis
        </button>
        <ReportView report={report} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Competitors */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <legend className="text-sm font-medium text-gray-700 px-1">Competitors / Topics</legend>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }}
              placeholder="e.g. Stripe"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addCompetitor}
              className="px-4 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Add
            </button>
          </div>
          {competitors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {competitors.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                  {c}
                  <button type="button" onClick={() => removeCompetitor(i)} className="text-blue-400 hover:text-blue-600 ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
        </fieldset>

        {/* URLs */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <legend className="text-sm font-medium text-gray-700 px-1">Source URLs</legend>
          <div className="space-y-2 mt-1">
            {urls.map((url, i) => (
              <div key={i} className="flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${urlErrors[i] ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                {urls.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    className="px-4 py-2 rounded-md border border-red-200 bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={addUrl}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
              {urlErrors[i] && (
                <p className="text-xs text-red-600 pl-1">{urlErrors[i]}</p>
              )}
              </div>
            ))}
          </div>
          {urls.length > 1 && (
            <button type="button" onClick={addUrl} className="mt-2 px-4 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              + Add URL
            </button>
          )}
        </fieldset>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">{error}</p>
        )}

        {/* Action row: role selector + submit */}
        <div className="flex gap-3 items-stretch">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleType | "")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </form>

      {loading && <div className="mt-6"><LoadingState currentStage={stage} message={stageMessage} /></div>}
    </div>
  );
}
