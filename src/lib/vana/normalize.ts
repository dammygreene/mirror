import type {
  MirrorSource,
  NormalizedInstagramProfile,
  NormalizedPayload,
  NormalizedSpotifyProfile,
  NormalizedSpotifyTrack,
  NormalizedYoutubeProfile,
  NormalizedYoutubeVideo,
} from "./constants";

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

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replaceAll(",", ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function pickNullableNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = pickNumber(value);
    if (parsed !== 0 || value === 0 || value === "0") return parsed;
  }
  return null;
}

function pickBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes"].includes(normalized)) return true;
      if (["false", "0", "no"].includes(normalized)) return false;
    }
  }
  return false;
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

function nestedProfile(data: unknown) {
  const record = asRecord(data);
  if (!record) return {};
  return asRecord(record.profile) ?? asRecord(record.user) ?? asRecord(record.channel) ?? record;
}

function normalizeSpotifyProfile(data: unknown, savedTracks: NormalizedSpotifyTrack[]): NormalizedSpotifyProfile {
  const profile = nestedProfile(data);
  const followers = asRecord(profile.followers);
  return {
    id: pickString(profile.id, profile.uri, profile.href, profile.display_name, profile.displayName, profile.name) ?? "spotify-profile",
    display_name: pickString(profile.display_name, profile.displayName, profile.name, profile.username, profile.id) ?? "Spotify profile",
    followers: pickNumber(followers?.total, profile.followers, profile.follower_count, profile.followerCount),
    following: pickNumber(profile.following, profile.following_count, profile.followingCount),
    savedTracks: savedTracks.length ? savedTracks : undefined,
  };
}

function normalizeYoutubeProfile(data: unknown, history: NormalizedYoutubeVideo[]): NormalizedYoutubeProfile {
  const profile = nestedProfile(data);
  const statistics = asRecord(profile.statistics);
  const snippet = asRecord(profile.snippet);
  return {
    channelTitle: pickString(profile.channelTitle, profile.title, profile.name, snippet?.title) ?? null,
    joinedDate: pickString(profile.joinedDate, profile.joined_date, profile.publishedAt, profile.createdAt, snippet?.publishedAt) ?? null,
    description: pickString(profile.description, profile.bio, snippet?.description) ?? null,
    subscriberCount: pickNullableNumber(profile.subscriberCount, profile.subscriber_count, statistics?.subscriberCount),
    videoCount: pickNullableNumber(profile.videoCount, profile.video_count, statistics?.videoCount),
    country: pickString(profile.country, snippet?.country) ?? null,
    history: history.length ? history : undefined,
  };
}

function normalizeInstagramProfile(data: unknown): NormalizedInstagramProfile {
  const profile = nestedProfile(data);
  return {
    username: pickString(profile.username, profile.handle, profile.id) ?? "instagram-profile",
    full_name: pickString(profile.full_name, profile.fullName, profile.name) ?? "",
    bio: pickString(profile.bio, profile.biography, profile.description) ?? "",
    follower_count: pickNumber(profile.follower_count, profile.followers, profile.followers_count, profile.followerCount),
    following_count: pickNumber(profile.following_count, profile.following, profile.follows_count, profile.followingCount),
    media_count: pickNumber(profile.media_count, profile.posts, profile.post_count, profile.mediaCount),
    is_private: pickBoolean(profile.is_private, profile.private),
    is_verified: pickBoolean(profile.is_verified, profile.verified),
    is_business: pickBoolean(profile.is_business, profile.business, profile.is_business_account),
  };
}

export function normalizeVanaData(source: MirrorSource, data: unknown): NormalizedPayload {
  if (source === "spotify") {
    const savedTracks = unwrapList(data, ["savedTracks", "saved_tracks", "tracks", "songs", "likedSongs"])
      .map(normalizeTrack)
      .filter((track): track is NormalizedSpotifyTrack => Boolean(track));
    return { source, sources: [source], spotify: normalizeSpotifyProfile(data, savedTracks) };
  }

  if (source === "youtube") {
    const history = unwrapList(data, ["history", "watchHistory", "watch_history", "videos"])
      .map(normalizeVideo)
      .filter((video): video is NormalizedYoutubeVideo => Boolean(video));
    return { source, sources: [source], youtube: normalizeYoutubeProfile(data, history) };
  }

  return { source, sources: [source], instagram: normalizeInstagramProfile(data) };
}
