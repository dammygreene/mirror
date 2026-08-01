import test from "node:test";
import assert from "node:assert/strict";
import { parseClaudeExport } from "../src/lib/claude-export/parse";

test("parseClaudeExport flattens parent-linked messages", () => {
  const parsed = parseClaudeExport([
    {
      uuid: "c1",
      name: "test",
      chat_messages: [
        { uuid: "m1", sender: "human", text: "hello", created_at: "2026-01-01T00:00:00.000Z" },
        {
          uuid: "m2",
          parent_message_uuid: "m1",
          sender: "assistant",
          text: "hi",
          created_at: "2026-01-01T00:00:01.000Z",
        },
      ],
    },
  ]);

  assert.equal(parsed.length, 1);
  assert.deepEqual(parsed[0].messages.map((m) => m.text), ["hello", "hi"]);
});
