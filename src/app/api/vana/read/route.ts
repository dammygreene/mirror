import { NextResponse } from "next/server";
import { z } from "zod";
import { getVanaController } from "@/lib/vana/controller";
import { normalizeVanaData } from "@/lib/vana/normalize";

const querySchema = z.object({
  source: z.enum(["chatgpt", "claude"]).default("chatgpt"),
  requestId: z.string().min(1),
});

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  try {
    const result = await getVanaController(parsed.data.source).readApprovedData({ requestId: parsed.data.requestId });
    const payload = normalizeVanaData(parsed.data.source, result.data);
    if (!payload.conversations.length) {
      const connectorNote =
        parsed.data.source === "claude"
          ? " The Claude connector is experimental, so try again if approval succeeded but no conversations were returned."
          : "";
      return NextResponse.json({ error: `No conversations were returned from Vana.${connectorNote}` }, { status: 502 });
    }

    return NextResponse.json({ ...payload, scope: result.scope, payment: result.payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vana read failed";
    const connectorNote =
      parsed.data.source === "claude" ? " Claude's connector is experimental; please try again in a moment." : "";
    return NextResponse.json({ error: `${message}.${connectorNote}` }, { status: 502 });
  }
}
