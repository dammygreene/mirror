import { NextResponse } from "next/server";
import { getCard } from "@/lib/store/kv";

export async function GET(_: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const card = await getCard(cardId);
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const search = new URL(_.url).searchParams;
  if (search.get("format") === "png") {
    return new NextResponse(Buffer.from(card.pngBase64, "base64"), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return NextResponse.json({
    cardId: card.cardId,
    sessionId: card.sessionId,
    source: card.source,
    createdAt: card.createdAt,
    persona: card.persona,
    imageUrl: `/api/card/${card.cardId}?format=png`,
  });
}
