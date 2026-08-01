import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { PERSONA_SYSTEM_PROMPT } from "./prompt";
import { isValidPersonaResult, type PersonaResult } from "./types";
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
    ...tracks.flatMap((track) => [track.title, track.artist, track.genre]),
    ...videos.flatMap((video) => [video.title, video.channel, video.category]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const family = (["crimson", "violet", "emerald", "amber", "cyan"] as const)[corpus.length % 5];
  const energyScore = Math.min(100, Math.max(20, Math.floor((corpus.length % 81) + 20)));
  const hasBoth = Boolean(tracks.length && videos.length);
  return {
    archetype: hasBoth ? "The Crossfade Rabbit Hole" : tracks.length ? "The Replay Loop Oracle" : "The Midnight Queue Diver",
    tagline: "Your algorithm knows exactly which mood you pretend is accidental.",
    topObsessions: [
      tracks[0]?.artist ?? videos[0]?.channel ?? "Recurring comfort picks",
      tracks[1]?.genre ?? videos[1]?.category ?? "Niche loops",
      videos[0]?.channel ?? tracks[1]?.artist ?? "Late-night pattern spirals",
    ],
    weirdPattern: hasBoth
      ? "Your saved songs and watch history keep circling the same emotional weather from different angles."
      : tracks.length
        ? "Your saved tracks suggest you do not find a mood so much as move into it."
        : "Your watch history has the unmistakable shape of one more video becoming a whole personality lane.",
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

function buildUserPrompt(payload: PersonaEngineInput, strict: boolean) {
  const input = JSON.stringify({
    sources: payload.sources,
    spotify: payload.spotify
      ? {
          savedTracks: sampleItems(payload.spotify.savedTracks, 80),
        }
      : undefined,
    youtube: payload.youtube
      ? {
          history: sampleItems(payload.youtube.history, 80),
        }
      : undefined,
  });
  if (!strict) return input;
  return `${input}\n\nSTRICT: Return only valid JSON matching the schema exactly. Use exactly three topObsessions and one allowed colorFamily.`;
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

async function attemptGeminiPersona(ai: GoogleGenAI, payload: PersonaEngineInput, strict: boolean) {
  recordGeminiRequest();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(payload, strict) }] }],
    config: {
      systemInstruction: PERSONA_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(text) as unknown;
}

export async function generatePersona(payload: PersonaEngineInput): Promise<PersonaResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fallbackPersona(payload);

  const ai = new GoogleGenAI({ apiKey: key });
  let parsed: unknown = null;

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

  return isValidPersonaResult(parsed) ? parsed : fallbackPersona(payload);
}
