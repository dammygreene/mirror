import test from "node:test";
import assert from "node:assert/strict";
import { generatePersona } from "../src/lib/persona/generate";

test("generatePersona returns valid fallback shape", async () => {
  delete process.env.GEMINI_API_KEY;
  const result = await generatePersona({
    source: "chatgpt",
    conversations: [
      {
        id: "a",
        messages: [{ role: "user", text: "help me debug this deploy" }],
      },
    ],
  });

  assert.ok(result.archetype.length > 0);
  assert.equal(result.topObsessions.length, 3);
  assert.ok(result.energyScore >= 0 && result.energyScore <= 100);
});
