import { NextResponse } from "next/server";
import { z } from "zod";
import { SOURCES } from "@/lib/vana/constants";
import { createMockRequest } from "@/lib/vana/mock-state";

const bodySchema = z.object({ source: z.enum(["chatgpt", "claude"]).default("chatgpt") });

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid source" }, { status: 400 });

  const { requestId, sessionId } = createMockRequest(parsed.data.source);

  return NextResponse.json({
    requestId,
    sessionId,
    approvalUrl:
      process.env.VANA_APPROVAL_URL ??
      `https://app.vana.org/approve?scope=${encodeURIComponent(SOURCES[parsed.data.source])}`,
  });
}
