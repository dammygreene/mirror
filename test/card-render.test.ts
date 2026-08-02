import test from "node:test";
import assert from "node:assert/strict";
import { renderCard } from "../src/lib/card/render";

test("renderCard returns png and svg", async () => {
  const result = await renderCard(
    {
      archetype: "The Velvet Rabbit Hole",
      tagline: "Always one more replay.",
      topObsessions: ["Synth nostalgia", "Tiny desk sets", "Late-night R&B"],
      weirdPattern: "Turns every mood into a curated queue.",
      energyScore: 72,
      colorFamily: "amber",
    },
    "instagram-spotify-youtube",
  );

  assert.ok(result.svg.includes("THE VELVET RABBIT HOLE"));
  assert.ok(result.png.length > 1000);
});
