import { NextResponse } from "next/server";
import { z } from "zod";
import { renderCard } from "@/lib/card/render";

const bodySchema = z.object({
  source: z.enum(["chatgpt", "claude"]),
  persona: z.object({
    archetype: z.string(),
    tagline: z.string(),
    topObsessions: z.array(z.string()),
    weirdPattern: z.string(),
    energyScore: z.number(),
    colorFamily: z.enum(["crimson", "violet", "emerald", "amber", "cyan"]),
  }),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { png } = await renderCard(parsed.data.persona, parsed.data.source);
  const body = Uint8Array.from(png).buffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
