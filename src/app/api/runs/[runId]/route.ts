import { NextRequest } from "next/server";
import { db } from "../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const run = db.getRun(runId);
  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }
  return Response.json(run.report);
}
