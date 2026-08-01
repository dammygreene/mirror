import { NextResponse } from "next/server";
import { z } from "zod";
import { samplePayload } from "@/data/persona.fixture";
import { getSession } from "@/lib/store/kv";

const querySchema = z.object({
  source: z.enum(["chatgpt", "claude"]).default("chatgpt"),
  sessionId: z.string().optional(),
});

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  if (parsed.data.source === "claude" && parsed.data.sessionId) {
    const session = await getSession(parsed.data.sessionId);
    if (session?.conversations) {
      return NextResponse.json({ source: "claude", conversations: session.conversations });
    }
  }

  return NextResponse.json(samplePayload);
}
