import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { PERSONA_SYSTEM_PROMPT } from "./prompt";
import type { PersonaResult } from "./types";
import type { NormalizedPayload } from "@/lib/vana/constants";

const PersonaSchema = z.object({
  archetype: z.string().min(3),
  tagline: z.string().min(8),
  topObsessions: z.array(z.string()).length(3),
  weirdPattern: z.string().min(8),
  energyScore: z.number().int().min(0).max(100),
  colorFamily: z.enum(["crimson", "violet", "emerald", "amber", "cyan"]),
});

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

export async function generatePersona(payload: NormalizedPayload): Promise<PersonaResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallbackPersona(payload);

  const input = JSON.stringify({
    source: payload.source,
    conversations: payload.conversations.slice(0, 20).map((c) => ({
      title: c.title,
      messages: c.messages.slice(-25),
    })),
  });

  const anthropic = new Anthropic({ apiKey: key });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 700,
    system: PERSONA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });

  const text = response.content.find((c) => c.type === "text");
  if (!text || text.type !== "text") return fallbackPersona(payload);

  try {
    return PersonaSchema.parse(JSON.parse(text.text));
  } catch {
    return fallbackPersona(payload);
  }
}
