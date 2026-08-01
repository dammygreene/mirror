import { NextResponse } from "next/server";
import { z } from "zod";
import { getVanaController, getVanaReturnUrl } from "@/lib/vana/controller";

const bodySchema = z.object({ source: z.enum(["chatgpt", "claude"]).default("chatgpt") });

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid source" }, { status: 400 });

  try {
    const request = await getVanaController(parsed.data.source).createAccessRequest({
      returnUrl: getVanaReturnUrl(),
    });

    return NextResponse.json({
      ...request,
      sessionId: request.requestId,
      source: parsed.data.source,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Vana request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
