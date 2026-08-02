import type { PersonaResult } from "@/lib/persona/types";
import type { PersonaEngineInput } from "@/lib/vana/constants";

export const samplePayload: PersonaEngineInput = {
  sources: ["instagram", "youtube", "spotify"],
  instagram: {
    username: "velvet.signal",
    full_name: "Velvet Signal",
    bio: "night drives, tiny rooms, better lighting",
    follower_count: 412,
    following_count: 87,
    media_count: 18,
    is_private: true,
    is_verified: false,
    is_business: false,
  },
  spotify: {
    id: "velvet-signal",
    display_name: "Velvet Signal",
    followers: 42,
    following: 12,
    savedTracks: [
      { title: "Night Drive", artist: "Ari Lennox", genre: "r&b" },
      { title: "Instant Crush", artist: "Daft Punk", genre: "electronic" },
    ],
  },
  youtube: {
    channelTitle: "Velvet Signal",
    joinedDate: "2015-04-18",
    description: "collecting sound, small spaces, and things that glow",
    subscriberCount: 14,
    videoCount: 0,
    country: null,
    history: [
      { title: "Why everyone is using analog synths again", channel: "Sound Field", category: "music" },
      { title: "Tiny apartment desk setup", channel: "Never Too Small", category: "design" },
    ],
  },
};

export const samplePersona: PersonaResult = {
  archetype: "The Velvet Rabbit Hole",
  tagline: "You say background noise; your algorithm says emotional architecture.",
  topObsessions: ["Private-account glow", "Synth nostalgia", "Design rabbit holes"],
  weirdPattern: "Your bio, channel, and playlists all keep turning introspection into interior design.",
  energyScore: 74,
  colorFamily: "violet",
};
