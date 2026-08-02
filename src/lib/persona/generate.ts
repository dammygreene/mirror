import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { PERSONA_SYSTEM_PROMPT } from "./prompt";
import { isValidPersonaResult, type PersonaResult } from "./types";
import { listRecentCards } from "@/lib/store/kv";
import type { PersonaEngineInput } from "@/lib/vana/constants";

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_DAILY_FREE_CAP = 1000;
const GEMINI_DAILY_WARN_AT = Math.floor(GEMINI_DAILY_FREE_CAP * 0.9);

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    archetype: { type: Type.STRING },
    tagline: { type: Type.STRING },
    topObsessions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: "3",
      maxItems: "3",
    },
    weirdPattern: { type: Type.STRING },
    energyScore: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    colorFamily: {
      type: Type.STRING,
      format: "enum",
      enum: ["crimson", "violet", "emerald", "amber", "cyan"],
    },
  },
  required: ["archetype", "tagline", "topObsessions", "weirdPattern", "energyScore", "colorFamily"],
  propertyOrdering: ["archetype", "tagline", "topObsessions", "weirdPattern", "energyScore", "colorFamily"],
};

let geminiUsageDay = "";
let geminiRequestsToday = 0;
let warnedDailyCap = false;

export class PersonaRateLimitError extends Error {
  constructor() {
    super("Gemini is rate limited. Try again in a moment.");
    this.name = "PersonaRateLimitError";
  }
}

function fallbackPersona(payload: PersonaEngineInput): PersonaResult {
  const tracks = payload.spotify?.savedTracks ?? [];
  const videos = payload.youtube?.history ?? [];
  const corpus = [
    payload.instagram?.username,
    payload.instagram?.full_name,
    payload.instagram?.bio,
    payload.youtube?.channelTitle,
    payload.youtube?.description,
    payload.youtube?.joinedDate,
    payload.spotify?.display_name,
    payload.spotify?.id,
    ...tracks.flatMap((track) => [track.title, track.artist, track.genre]),
    ...videos.flatMap((video) => [video.title, video.channel, video.category]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const family = (["crimson", "violet", "emerald", "amber", "cyan"] as const)[corpus.length % 5];
  const energyScore = Math.min(100, Math.max(20, Math.floor((corpus.length % 81) + 20)));
  const followerGap = payload.instagram
    ? Math.abs(payload.instagram.follower_count - payload.instagram.following_count)
    : Math.abs((payload.spotify?.followers ?? 0) - (payload.spotify?.following ?? 0));
  const hasQuietChannel = payload.youtube?.videoCount === 0 && Boolean(payload.youtube.joinedDate);
  const hasText = Boolean(payload.instagram?.bio || payload.youtube?.description);
  const primaryName =
    payload.instagram?.username ??
    payload.youtube?.channelTitle ??
    payload.spotify?.display_name ??
    tracks[0]?.artist ??
    videos[0]?.channel;
  return {
    archetype: payload.instagram?.is_private
      ? "Velvet Lockbox"
      : hasQuietChannel
        ? "Quiet Archivist"
        : hasText
          ? "Curated Glitch"
          : "Ratio Poet",
    tagline: payload.instagram?.is_private
      ? "You lock the door, then leave the best line visible in the window"
      : hasQuietChannel
        ? "You joined early, posted barely anything, and somehow made restraint the loudest move"
        : followerGap > 100
          ? "You treat attention like a budget, and the math is absolutely part of the outfit"
          : "You give just enough away to make people overthink the rest",
    topObsessions: [
      primaryName ?? "Carefully chosen name",
      payload.instagram?.is_private ? "Locked-door charisma" : hasQuietChannel ? "Loud restraint" : "Attention math",
      hasText ? "Aesthetic breadcrumbing" : "Minimalist self-editing",
    ],
    weirdPattern: payload.instagram?.is_private
      ? "The private switch does not hide the performance; it just makes the visible parts feel more deliberate"
      : hasQuietChannel
        ? "The old join date paired with zero output reads less like absence and more like a long-running soft launch"
        : "The follow math and naming choices suggest someone who edits the room before entering it",
    energyScore,
    colorFamily: family,
  };
}

function sampleItems<T>(items: T[], limit: number) {
  if (items.length <= limit) return items;
  const recent = items.slice(0, Math.ceil(limit * 0.65));
  const spreadCount = limit - recent.length;
  const step = Math.max(1, Math.floor((items.length - recent.length) / spreadCount));
  const spread = items.slice(recent.length).filter((_, index) => index % step === 0).slice(0, spreadCount);
  return [...recent, ...spread];
}

function buildUserPrompt(payload: PersonaEngineInput, strict: boolean, avoidArchetypes: string[] = []) {
  const input = JSON.stringify({
    sources: payload.sources,
    spotify: payload.spotify
      ? {
          id: payload.spotify.id,
          display_name: payload.spotify.display_name,
          followers: payload.spotify.followers,
          following: payload.spotify.following,
          savedTracks: payload.spotify.savedTracks ? sampleItems(payload.spotify.savedTracks, 80) : undefined,
        }
      : undefined,
    youtube: payload.youtube
      ? {
          channelTitle: payload.youtube.channelTitle,
          joinedDate: payload.youtube.joinedDate,
          description: payload.youtube.description,
          subscriberCount: payload.youtube.subscriberCount,
          videoCount: payload.youtube.videoCount,
          country: payload.youtube.country,
          history: payload.youtube.history ? sampleItems(payload.youtube.history, 80) : undefined,
        }
      : undefined,
    instagram: payload.instagram,
  });
  const repetitionNote = avoidArchetypes.length
    ? `\n\nAVOID THESE RECENT ARCHETYPES AND THEIR NEAR-DUPLICATES: ${avoidArchetypes.join(", ")}. Create a materially different archetype and tagline structure for this person.`
    : "";
  if (!strict) return `${input}${repetitionNote}`;
  return `${input}${repetitionNote}\n\nSTRICT: Return only valid JSON matching the schema exactly. Use exactly three topObsessions and one allowed colorFamily.`;
}

function recordGeminiRequest() {
  const day = new Date().toISOString().slice(0, 10);
  if (geminiUsageDay !== day) {
    geminiUsageDay = day;
    geminiRequestsToday = 0;
    warnedDailyCap = false;
  }
  geminiRequestsToday += 1;
  if (!warnedDailyCap && geminiRequestsToday >= GEMINI_DAILY_WARN_AT) {
    warnedDailyCap = true;
    console.warn(`Gemini persona generation is at ${geminiRequestsToday}/${GEMINI_DAILY_FREE_CAP} estimated requests today.`);
  }
}

function isRateLimitError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { status?: number; code?: number; message?: string };
  return maybe.status === 429 || maybe.code === 429 || maybe.message?.includes("429") === true;
}

async function attemptGeminiPersona(
  ai: GoogleGenAI,
  payload: PersonaEngineInput,
  strict: boolean,
  avoidArchetypes: string[] = [],
) {
  recordGeminiRequest();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(payload, strict, avoidArchetypes) }] }],
    config: {
      systemInstruction: PERSONA_SYSTEM_PROMPT,
      temperature: 0.95,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(text) as unknown;
}

function normalizeArchetype(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isRepeatedArchetype(archetype: string, recent: string[]) {
  const normalized = normalizeArchetype(archetype);
  return recent.some((item) => {
    const other = normalizeArchetype(item);
    return normalized === other || normalized.includes(other) || other.includes(normalized);
  });
}

async function recentArchetypes() {
  try {
    const cards = await listRecentCards(10);
    return cards
      .map((card) => (card.persona as { archetype?: unknown }).archetype)
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

export async function generatePersona(payload: PersonaEngineInput): Promise<PersonaResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fallbackPersona(payload);

  const ai = new GoogleGenAI({ apiKey: key });
  let parsed: unknown = null;
  const avoidArchetypes = await recentArchetypes();

  try {
    parsed = await attemptGeminiPersona(ai, payload, false);
  } catch (error) {
    if (isRateLimitError(error)) throw new PersonaRateLimitError();
  }

  if (!isValidPersonaResult(parsed)) {
    try {
      parsed = await attemptGeminiPersona(ai, payload, true);
    } catch (error) {
      if (isRateLimitError(error)) throw new PersonaRateLimitError();
    }
  }

  if (isValidPersonaResult(parsed) && avoidArchetypes.length && isRepeatedArchetype(parsed.archetype, avoidArchetypes)) {
    try {
      const fresh = await attemptGeminiPersona(ai, payload, true, avoidArchetypes);
      if (isValidPersonaResult(fresh)) parsed = fresh;
    } catch (error) {
      if (isRateLimitError(error)) throw new PersonaRateLimitError();
    }
  }

  return isValidPersonaResult(parsed) ? parsed : fallbackPersona(payload);
}
