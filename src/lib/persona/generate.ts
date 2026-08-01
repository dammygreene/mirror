import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { PERSONA_SYSTEM_PROMPT } from "./prompt";
import { isValidPersonaResult, type PersonaResult } from "./types";
import type { NormalizedPayload } from "@/lib/vana/constants";

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

function fallbackPersona(payload: NormalizedPayload): PersonaResult {
  const corpus = payload.conversations
    .flatMap((c) => c.messages.map((m) => m.text.toLowerCase()))
    .join(" ");
  const family = (["crimson", "violet", "emerald", "amber", "cyan"] as const)[corpus.length % 5];
  const energyScore = Math.min(100, Math.max(20, Math.floor((corpus.length % 81) + 20)));
  return {
    archetype: payload.source === "claude" ? "The Thought Cartographer" : "The Prompt Loop Architect",
    tagline: "Your AI sessions read like a sprint retro with plot twists.",
    topObsessions: ["Iterating prompts", "Polishing outputs", "Chasing clarity"],
    weirdPattern: "You keep revisiting old ideas until they become cleaner and sharper.",
    energyScore,
    colorFamily: family,
  };
}

function buildUserPrompt(payload: NormalizedPayload, strict: boolean) {
  const input = JSON.stringify({
    source: payload.source,
    conversations: payload.conversations.slice(0, 20).map((c) => ({
      title: c.title,
      messages: c.messages.slice(-25),
    })),
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

async function attemptGeminiPersona(ai: GoogleGenAI, payload: NormalizedPayload, strict: boolean) {
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

export async function generatePersona(payload: NormalizedPayload): Promise<PersonaResult> {
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
