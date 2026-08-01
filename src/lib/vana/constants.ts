export const SOURCES = {
  spotify: "spotify.savedTracks",
  youtube: "youtube.history",
} as const;

export type MirrorSource = keyof typeof SOURCES;
export type MirrorCardSource = MirrorSource | "spotify-youtube";

export type NormalizedSpotifyTrack = {
  title: string;
  artist: string;
  genre?: string;
  addedAt?: string;
};

export type NormalizedYoutubeVideo = {
  title: string;
  channel: string;
  category?: string;
  watchedAt?: string;
};

export type PersonaEngineInput = {
  sources: MirrorSource[];
  spotify?: {
    savedTracks: NormalizedSpotifyTrack[];
  };
  youtube?: {
    history: NormalizedYoutubeVideo[];
  };
};

export type NormalizedPayload = PersonaEngineInput & {
  source: MirrorSource;
};

export function cardSourceFromSources(sources: MirrorSource[]): MirrorCardSource {
  const unique = Array.from(new Set(sources));
  if (unique.includes("spotify") && unique.includes("youtube")) return "spotify-youtube";
  return unique[0] ?? "spotify";
}

export function cardSourceLabel(source: MirrorCardSource) {
  if (source === "spotify-youtube") return "SPOTIFY · YOUTUBE";
  return source.toUpperCase();
}

export function hasTasteData(input: PersonaEngineInput) {
  return Boolean(input.spotify?.savedTracks.length || input.youtube?.history.length);
}

export type LegacyNormalizedMessage = {
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
};

export type LegacyNormalizedConversation = {
  id: string;
  title?: string;
  messages: LegacyNormalizedMessage[];
};
