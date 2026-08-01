import type { NormalizedPayload } from "@/lib/vana/constants";
import type { PersonaResult } from "@/lib/persona/types";

export const samplePayload: NormalizedPayload = {
  source: "chatgpt",
  conversations: [
    {
      id: "fixture-1",
      title: "Late night debug",
      messages: [
        { role: "user", text: "Can you fix this regex again?" },
        { role: "assistant", text: "Sure, here's the corrected version." },
        { role: "user", text: "Why is TypeScript mad now?" },
      ],
    },
  ],
};

export const samplePersona: PersonaResult = {
  archetype: "The 3AM Debugger",
  tagline: "You call it focus; your commit history calls it nocturnal chaos.",
  topObsessions: ["Regex rewrites", "Edge-case chasing", "Midnight refactors"],
  weirdPattern: "You re-ask the same bug with a slightly different stack trace.",
  energyScore: 74,
  colorFamily: "violet",
};
