import { NextRequest } from "next/server";
import { z } from "zod";
import { runPipeline } from "../../../lib/pipeline";
import type { SSEEvent } from "../../../lib/types";

export const maxDuration = 60;

const requestSchema = z.object({
  competitors: z.array(z.string().min(1)).min(1).max(20),
  urls: z
    .array(
      z.string().url().refine(
        (url) => {
          try {
            const parsed = new URL(url);
            if (parsed.protocol !== "https:") return false;
            const hostname = parsed.hostname;
            if (hostname === "localhost" || hostname === "127.0.0.1") return false;
            // Block RFC-1918 private ranges
            if (hostname.startsWith("10.")) return false;
            if (hostname.startsWith("192.168.")) return false;
            if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
            return true;
          } catch {
            return false;
          }
        },
        { message: "Only public HTTPS URLs are allowed" }
      )
    )
    .min(1)
    .max(parseInt(process.env.MAX_URLS_PER_REQUEST || "10", 10)),
  role: z.enum(["pm", "exec", "sales", "eng"]).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      await runPipeline(parsed.data, emit);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
