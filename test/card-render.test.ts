import test from "node:test";
import assert from "node:assert/strict";
import { renderCard } from "../src/lib/card/render";

test("renderCard returns png and svg", async () => {
  const result = await renderCard(
    {
      archetype: "The 3AM Debugger",
      tagline: "Always one more patch.",
      topObsessions: ["Debugging", "Refactor", "Retries"],
      weirdPattern: "Reopens solved tickets just to optimize naming.",
      energyScore: 72,
      colorFamily: "amber",
    },
    "chatgpt",
  );

  assert.ok(result.svg.includes("THE 3AM DEBUGGER"));
  assert.ok(result.png.length > 1000);
});
