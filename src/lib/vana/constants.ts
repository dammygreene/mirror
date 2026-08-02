export const SOURCES = {
  instagram: "instagram.profile",
  youtube: "youtube.profile",
  spotify: "spotify.profile",
} as const;

export type MirrorSource = keyof typeof SOURCES;
export type MirrorCardSource =
  | MirrorSource
  | "spotify-youtube"
  | "instagram-spotify"
  | "instagram-youtube"
  | "instagram-spotify-youtube";

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

export type NormalizedSpotifyProfile = {
  id: string;
  display_name: string;
  followers: number;
  following: number;
  savedTracks?: NormalizedSpotifyTrack[];
};

export type NormalizedYoutubeProfile = {
  channelTitle: string | null;
  joinedDate: string | null;
  description: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  country: string | null;
  history?: NormalizedYoutubeVideo[];
};

export type NormalizedInstagramProfile = {
  username: string;
  full_name: string;
  bio: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  is_private: boolean;
  is_verified: boolean;
  is_business: boolean;
};

export type PersonaEngineInput = {
  sources: MirrorSource[];
  spotify?: NormalizedSpotifyProfile;
  youtube?: NormalizedYoutubeProfile;
  instagram?: NormalizedInstagramProfile;
};

export type NormalizedPayload = PersonaEngineInput & {
  source: MirrorSource;
};

const sourceOrder: MirrorSource[] = ["instagram", "youtube", "spotify"];

export function cardSourceFromSources(sources: MirrorSource[]): MirrorCardSource {
  const unique = Array.from(new Set(sources)).sort((a, b) => sourceOrder.indexOf(a) - sourceOrder.indexOf(b));
  if (unique.includes("instagram") && unique.includes("youtube") && unique.includes("spotify")) return "instagram-spotify-youtube";
  if (unique.includes("instagram") && unique.includes("spotify")) return "instagram-spotify";
  if (unique.includes("instagram") && unique.includes("youtube")) return "instagram-youtube";
  if (unique.includes("youtube") && unique.includes("spotify")) return "spotify-youtube";
  return unique[0] ?? "spotify";
}

export function sourcesFromCardSource(source: MirrorCardSource): MirrorSource[] {
  if (source === "instagram-spotify-youtube") return ["instagram", "youtube", "spotify"];
  if (source === "instagram-spotify") return ["instagram", "spotify"];
  if (source === "instagram-youtube") return ["instagram", "youtube"];
  if (source === "spotify-youtube") return ["youtube", "spotify"];
  return [source];
}

export function cardSourceLabel(source: MirrorCardSource) {
  return sourcesFromCardSource(source).map((item) => item.toUpperCase()).join(" · ");
}

export function hasTasteData(input: PersonaEngineInput) {
  return Boolean(input.instagram || input.youtube || input.spotify);
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
