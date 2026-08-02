import test from "node:test";
import assert from "node:assert/strict";
import { generatePersona } from "../src/lib/persona/generate";

test("generatePersona returns valid fallback shape", async () => {
  delete process.env.GEMINI_API_KEY;
  const result = await generatePersona({
    sources: ["instagram", "youtube", "spotify"],
    instagram: {
      username: "locked.signal",
      full_name: "Locked Signal",
      bio: "sound, small rooms, soft light",
      follower_count: 88,
      following_count: 12,
      media_count: 3,
      is_private: true,
      is_verified: false,
      is_business: false,
    },
    spotify: {
      id: "ari-loop",
      display_name: "Ari Loop",
      followers: 7,
      following: 3,
      savedTracks: [{ title: "Night Drive", artist: "Ari Lennox", genre: "r&b" }],
    },
    youtube: {
      channelTitle: "Sound Field Notes",
      joinedDate: "2017-08-10",
      description: "analog synths and tiny desk setups",
      subscriberCount: 10,
      videoCount: 0,
      country: null,
      history: [{ title: "Why analog synths are back", channel: "Sound Field", category: "music" }],
    },
  });

  assert.ok(result.archetype.length > 0);
  assert.equal(result.topObsessions.length, 3);
  assert.ok(result.energyScore >= 0 && result.energyScore <= 100);
});
