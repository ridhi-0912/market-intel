import { db } from "../../../lib/db";
import ReportView from "../../../components/ReportView";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ runId: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { runId } = await params;
  const run = await db.getRun(runId);

  if (!run) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
        <p className="text-sm text-gray-500">
          Run {runId.slice(0, 8)}... — {new Date(run.report.generatedAt).toLocaleString()}
        </p>
      </div>
      <ReportView report={run.report} />
    </div>
  );
}
