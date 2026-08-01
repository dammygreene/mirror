import { NextResponse } from "next/server";
import { listRecentCards } from "@/lib/store/kv";

export async function GET() {
  const cards = await listRecentCards(15);
  return NextResponse.json({
    items: cards.map((c) => ({
      cardId: c.cardId,
      archetype: (c.persona as { archetype?: string })?.archetype ?? "Unknown",
      source: c.source,
      createdAt: c.createdAt,
    })),
  });
}
