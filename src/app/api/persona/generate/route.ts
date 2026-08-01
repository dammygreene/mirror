import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePersona } from "@/lib/persona/generate";
import { storeSession } from "@/lib/store/kv";

const bodySchema = z.object({
  sessionId: z.string().default(() => crypto.randomUUID()),
  source: z.enum(["chatgpt", "claude"]),
  conversations: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      messages: z.array(
        z.object({ role: z.enum(["user", "assistant"]), text: z.string(), timestamp: z.string().optional() }),
      ),
    }),
  ),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const persona = await generatePersona({
    source: parsed.data.source,
    conversations: parsed.data.conversations,
  });

  await storeSession({
    sessionId: parsed.data.sessionId,
    source: parsed.data.source,
    conversations: parsed.data.conversations,
    persona,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ sessionId: parsed.data.sessionId, persona });
}
