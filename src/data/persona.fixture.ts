import type { PersonaResult } from "@/lib/persona/types";
import type { PersonaEngineInput } from "@/lib/vana/constants";

export const samplePayload: PersonaEngineInput = {
  sources: ["spotify", "youtube"],
  spotify: {
    savedTracks: [
      { title: "Night Drive", artist: "Ari Lennox", genre: "r&b" },
      { title: "Instant Crush", artist: "Daft Punk", genre: "electronic" },
    ],
  },
  youtube: {
    history: [
      { title: "Why everyone is using analog synths again", channel: "Sound Field", category: "music" },
      { title: "Tiny apartment desk setup", channel: "Never Too Small", category: "design" },
    ],
  },
};

export const samplePersona: PersonaResult = {
  archetype: "The Velvet Rabbit Hole",
  tagline: "You say background noise; your algorithm says emotional architecture.",
  topObsessions: ["Late-night R&B", "Synth nostalgia", "Design rabbit holes"],
  weirdPattern: "Your playlists and watch history both keep trying to turn introspection into interior design.",
  energyScore: 74,
  colorFamily: "violet",
};
