import { NextResponse } from "next/server";
import { z } from "zod";
import { getVanaController } from "@/lib/vana/controller";
import { normalizeVanaData } from "@/lib/vana/normalize";
import { hasTasteData } from "@/lib/vana/constants";
import { mirrorSourceSchema } from "@/lib/vana/schemas";

const querySchema = z.object({
  source: mirrorSourceSchema.default("spotify"),
  requestId: z.string().min(1),
  trigger: z.string().min(1).default("unknown"),
});

function completionLog(event: string, details: Record<string, unknown>) {
  console.info(`[Mirror Vana completion] ${event}`, {
    ...details,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const startedAt = Date.now();
  completionLog("server readApprovedData start", {
    requestId: parsed.data.requestId,
    source: parsed.data.source,
    trigger: parsed.data.trigger,
    endpoint: "/api/vana/read",
  });

  try {
    const result = await getVanaController(parsed.data.source).readApprovedData({ requestId: parsed.data.requestId });
    const payload = normalizeVanaData(parsed.data.source, result.data);
    if (!hasTasteData(payload)) {
      completionLog("server readApprovedData empty-data", {
        requestId: parsed.data.requestId,
        source: parsed.data.source,
        trigger: parsed.data.trigger,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: `No ${parsed.data.source} data was returned from Vana.` }, { status: 502 });
    }

    completionLog("server readApprovedData success", {
      requestId: parsed.data.requestId,
      source: parsed.data.source,
      trigger: parsed.data.trigger,
      scope: result.scope,
      hasPayment: Boolean(result.payment),
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ...payload, scope: result.scope, payment: result.payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vana read failed";
    completionLog("server readApprovedData error", {
      requestId: parsed.data.requestId,
      source: parsed.data.source,
      trigger: parsed.data.trigger,
      durationMs: Date.now() - startedAt,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
