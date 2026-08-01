import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePersona, PersonaRateLimitError } from "@/lib/persona/generate";
import { storeSession } from "@/lib/store/kv";

const sourceSchema = z.enum(["spotify", "youtube"]);

const bodySchema = z.object({
  sessionId: z.string().default(() => crypto.randomUUID()),
  sources: z.array(sourceSchema).min(1).max(2),
  spotify: z
    .object({
      savedTracks: z.array(
        z.object({
          title: z.string(),
          artist: z.string(),
          genre: z.string().optional(),
          addedAt: z.string().optional(),
        }),
      ),
    })
    .optional(),
  youtube: z
    .object({
      history: z.array(
        z.object({
          title: z.string(),
          channel: z.string(),
          category: z.string().optional(),
          watchedAt: z.string().optional(),
        }),
      ),
    })
    .optional(),
}).refine((data) => Boolean(data.spotify?.savedTracks.length || data.youtube?.history.length), {
  message: "Connect Spotify or YouTube first",
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  let persona;
  try {
    persona = await generatePersona({
      sources: parsed.data.sources,
      spotify: parsed.data.spotify,
      youtube: parsed.data.youtube,
    });
  } catch (error) {
    if (error instanceof PersonaRateLimitError) {
      return NextResponse.json({ error: "Persona generation is busy. Try again in a moment." }, { status: 429 });
    }
    throw error;
  }

  await storeSession({
    sessionId: parsed.data.sessionId,
    source: parsed.data.sources.includes("spotify") && parsed.data.sources.includes("youtube")
      ? "spotify-youtube"
      : parsed.data.sources[0],
    input: {
      sources: parsed.data.sources,
      spotify: parsed.data.spotify,
      youtube: parsed.data.youtube,
    },
    persona,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ sessionId: parsed.data.sessionId, persona });
}
