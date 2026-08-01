export type PersonaColorFamily = "crimson" | "violet" | "emerald" | "amber" | "cyan";

export type PersonaResult = {
  archetype: string;
  tagline: string;
  topObsessions: string[];
  weirdPattern: string;
  energyScore: number;
  colorFamily: PersonaColorFamily;
};

export function isValidPersonaResult(value: unknown): value is PersonaResult {
  if (!value || typeof value !== "object") return false;
  const persona = value as Partial<PersonaResult>;
  const energyScore = persona.energyScore;
  return (
    typeof persona.archetype === "string" &&
    persona.archetype.length >= 3 &&
    typeof persona.tagline === "string" &&
    persona.tagline.length >= 8 &&
    Array.isArray(persona.topObsessions) &&
    persona.topObsessions.length === 3 &&
    persona.topObsessions.every((item) => typeof item === "string" && item.length > 0) &&
    typeof persona.weirdPattern === "string" &&
    persona.weirdPattern.length >= 8 &&
    Number.isInteger(energyScore) &&
    typeof energyScore === "number" &&
    energyScore >= 0 &&
    energyScore <= 100 &&
    ["crimson", "violet", "emerald", "amber", "cyan"].includes(persona.colorFamily ?? "")
  );
}
