import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCard } from "@/lib/store/kv";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const card = await getCard(cardId);
  if (!card) return new Response("Not found", { status: 404 });

  const fraunces = await readFile(path.join(process.cwd(), "public", "fonts", "Fraunces.ttf"));
  const p = card.persona as {
    archetype: string;
    tagline: string;
    colorFamily: string;
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px",
          background: "linear-gradient(135deg,#020617,#111827)",
          color: "white",
          fontFamily: "Arial",
        }}
      >
        <div style={{ fontSize: 20, opacity: 0.9 }}>MIRROR - {String(p.colorFamily).toUpperCase()}</div>
        <div style={{ fontFamily: "Fraunces", fontSize: 72, fontWeight: 900, marginTop: 20 }}>{p.archetype}</div>
        <div style={{ fontFamily: "Fraunces", fontSize: 32, opacity: 0.9, marginTop: 12 }}>{p.tagline}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Fraunces",
          data: fraunces,
          weight: 900,
        },
      ],
    },
  );
}
