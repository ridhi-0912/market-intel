import { db } from "../../../lib/db";

export async function GET() {
  const runs = await db.listRuns(50);
  const summary = runs.map((r) => ({
    runId: r.runId,
    createdAt: r.createdAt,
    competitors: r.competitors,
    urlCount: r.urls.length,
    role: r.role,
  }));
  return Response.json(summary);
}
