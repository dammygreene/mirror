import { NextResponse } from "next/server";
import { z } from "zod";
import { createReferrer } from "@/lib/store/kv";

const bodySchema = z.object({
  handle: z.string().min(1),
  sessionId: z.string(),
  cardId: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const result = await createReferrer(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ referrer: result.referrer });
}
