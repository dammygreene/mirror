export type PersonaColorFamily = "crimson" | "violet" | "emerald" | "amber" | "cyan";

export type PersonaResult = {
  archetype: string;
  tagline: string;
  topObsessions: string[];
  weirdPattern: string;
  energyScore: number;
  colorFamily: PersonaColorFamily;
};
