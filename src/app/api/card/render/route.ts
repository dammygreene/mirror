import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { renderCard } from "@/lib/card/render";
import { creditReferral, storeCard, getSession, storeSession } from "@/lib/store/kv";
import { mirrorCardSourceSchema } from "@/lib/vana/schemas";

const bodySchema = z.object({
  sessionId: z.string(),
  source: mirrorCardSourceSchema,
  persona: z.object({
    archetype: z.string(),
    tagline: z.string(),
    topObsessions: z.array(z.string()),
    weirdPattern: z.string(),
    energyScore: z.number(),
    colorFamily: z.enum(["crimson", "violet", "emerald", "amber", "cyan"]),
  }),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { png, svg } = await renderCard(parsed.data.persona, parsed.data.source);
  const cardId = crypto.randomUUID();

  await storeCard({
    cardId,
    sessionId: parsed.data.sessionId,
    source: parsed.data.source,
    createdAt: new Date().toISOString(),
    persona: parsed.data.persona,
    svg,
    pngBase64: Buffer.from(png).toString("base64"),
  });

  const session = await getSession(parsed.data.sessionId);
  if (session) {
    await storeSession({ ...session, cardId: cardId, persona: parsed.data.persona });
  }

  const pendingReferral = req.cookies.get("mirror_ref")?.value;
  const creditedReferral = pendingReferral ? await creditReferral(pendingReferral, parsed.data.sessionId) : undefined;

  const response = NextResponse.json({
    cardId,
    sessionId: parsed.data.sessionId,
    shareUrl: `/c/${cardId}`,
    referral: creditedReferral,
  });
  if (creditedReferral?.credited) response.cookies.delete("mirror_ref");
  return response;
}
