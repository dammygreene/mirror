import { NextResponse } from "next/server";
import { z } from "zod";
import { toClaudeSchema } from "@/lib/claude-export/to-schema";
import { storeSession } from "@/lib/store/kv";

const bodySchema = z.object({
  sessionId: z.string().default(() => crypto.randomUUID()),
  conversations: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          text: z.string(),
          timestamp: z.string().optional(),
        }),
      ),
    }),
  ),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const sessionId = parsed.data.sessionId;
  await storeSession({
    sessionId,
    source: "claude",
    conversations: parsed.data.conversations,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ sessionId, schemaPayload: toClaudeSchema(parsed.data.conversations) });
}
