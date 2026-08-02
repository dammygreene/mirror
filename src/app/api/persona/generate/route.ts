import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePersona, PersonaRateLimitError } from "@/lib/persona/generate";
import { storeSession } from "@/lib/store/kv";
import { cardSourceFromSources } from "@/lib/vana/constants";
import { mirrorSourceSchema } from "@/lib/vana/schemas";

const spotifyTrackSchema = z.object({
  title: z.string(),
  artist: z.string(),
  genre: z.string().optional(),
  addedAt: z.string().optional(),
});

const youtubeVideoSchema = z.object({
  title: z.string(),
  channel: z.string(),
  category: z.string().optional(),
  watchedAt: z.string().optional(),
});

const bodySchema = z.object({
  sessionId: z.string().default(() => crypto.randomUUID()),
  sources: z.array(mirrorSourceSchema).min(1).max(3),
  spotify: z
    .object({
      id: z.string(),
      display_name: z.string(),
      followers: z.number(),
      following: z.number(),
      savedTracks: z.array(spotifyTrackSchema).optional(),
    })
    .optional(),
  youtube: z
    .object({
      channelTitle: z.string().nullable(),
      joinedDate: z.string().nullable(),
      description: z.string().nullable(),
      subscriberCount: z.number().nullable(),
      videoCount: z.number().nullable(),
      country: z.string().nullable(),
      history: z.array(youtubeVideoSchema).optional(),
    })
    .optional(),
  instagram: z
    .object({
      username: z.string(),
      full_name: z.string(),
      bio: z.string(),
      follower_count: z.number(),
      following_count: z.number(),
      media_count: z.number(),
      is_private: z.boolean(),
      is_verified: z.boolean(),
      is_business: z.boolean(),
    })
    .optional(),
}).refine((data) => Boolean(data.spotify || data.youtube || data.instagram), {
  message: "Connect Instagram, YouTube, or Spotify first",
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const input = {
    sources: parsed.data.sources,
    spotify: parsed.data.spotify,
    youtube: parsed.data.youtube,
    instagram: parsed.data.instagram,
  };

  let persona;
  try {
    persona = await generatePersona(input);
  } catch (error) {
    if (error instanceof PersonaRateLimitError) {
      return NextResponse.json({ error: "Persona generation is busy. Try again in a moment." }, { status: 429 });
    }
    throw error;
  }

  await storeSession({
    sessionId: parsed.data.sessionId,
    source: cardSourceFromSources(parsed.data.sources),
    input,
    persona,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ sessionId: parsed.data.sessionId, persona });
}
