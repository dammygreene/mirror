import type { PersonaColorFamily } from "@/lib/persona/types";

export const paletteFile: Record<PersonaColorFamily, string> = {
  amber: "/cards/amber.png",
  cyan: "/cards/cyan.png",
  violet: "/cards/violet.png",
  emerald: "/cards/emerald.png",
  crimson: "/cards/crimson.png",
};

export const paletteAccent: Record<PersonaColorFamily, string> = {
  crimson: "#E2544D",
  violet: "#8F7AE0",
  emerald: "#3FB681",
  amber: "#E6A13A",
  cyan: "#3BC4D9",
};

export const paletteText: Record<PersonaColorFamily, string> = {
  crimson: "#F7E7E5",
  violet: "#EEE9FB",
  emerald: "#E4F5EC",
  amber: "#FAEED9",
  cyan: "#E2F7FA",
};

export const paletteMuted: Record<PersonaColorFamily, string> = {
  crimson: "#B08782",
  violet: "#8F87AD",
  emerald: "#7FA593",
  amber: "#A8956F",
  cyan: "#7EA5AB",
};
