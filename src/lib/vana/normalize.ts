import type { MirrorSource, NormalizedPayload, NormalizedSpotifyTrack, NormalizedYoutubeVideo } from "./constants";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function findArray(record: UnknownRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = asRecord(value);
    if (Array.isArray(nested?.items)) return nested.items;
    if (Array.isArray(nested?.data)) return nested.data;
  }
  return [];
}

function unwrapList(data: unknown, keys: string[]) {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (!record) return [];
  return findArray(record, [...keys, "items", "data", "results"]);
}

function artistName(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((artist) => pickString(asRecord(artist)?.name, artist))
      .filter(Boolean)
      .join(", ");
  }
  return pickString(asRecord(value)?.name);
}

function normalizeTrack(value: unknown): NormalizedSpotifyTrack | null {
  const item = asRecord(value);
  if (!item) return null;
  const track = asRecord(item.track) ?? asRecord(item.song) ?? item;
  const album = asRecord(track.album);

  const title = pickString(track.title, track.name, item.title, item.name);
  const artist = pickString(track.artist, item.artist, artistName(track.artists), artistName(item.artists), album?.artist);
  if (!title || !artist) return null;

  return {
    title,
    artist,
    genre: pickString(track.genre, item.genre, album?.genre, Array.isArray(track.genres) ? track.genres[0] : undefined),
    addedAt: pickString(item.addedAt, item.added_at, track.addedAt, track.added_at, item.createdAt),
  };
}

function normalizeVideo(value: unknown): NormalizedYoutubeVideo | null {
  const item = asRecord(value);
  if (!item) return null;
  const video = asRecord(item.video) ?? asRecord(item.snippet) ?? item;

  const title = pickString(video.title, item.title, video.name, item.name);
  const channel = pickString(
    video.channel,
    video.channelTitle,
    video.channel_name,
    item.channel,
    item.channelTitle,
    item.creator,
    item.author,
  );
  if (!title || !channel) return null;

  return {
    title,
    channel,
    category: pickString(video.category, video.categoryName, item.category, item.topic),
    watchedAt: pickString(item.watchedAt, item.watched_at, item.time, item.timestamp, video.publishedAt, item.createdAt),
  };
}

export function normalizeVanaData(source: MirrorSource, data: unknown): NormalizedPayload {
  if (source === "spotify") {
    const savedTracks = unwrapList(data, ["savedTracks", "saved_tracks", "tracks", "songs", "likedSongs"])
      .map(normalizeTrack)
      .filter((track): track is NormalizedSpotifyTrack => Boolean(track));
    return { source, sources: [source], spotify: { savedTracks } };
  }

  const history = unwrapList(data, ["history", "watchHistory", "watch_history", "videos"])
    .map(normalizeVideo)
    .filter((video): video is NormalizedYoutubeVideo => Boolean(video));
  return { source, sources: [source], youtube: { history } };
}
