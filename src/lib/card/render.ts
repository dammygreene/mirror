import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildCardSvg } from "./template";
import { paletteFile } from "./palette";
import type { PersonaResult } from "@/lib/persona/types";

export async function renderCard(persona: PersonaResult, source: "chatgpt" | "claude") {
  const rel = paletteFile[persona.colorFamily];
  const bgPath = path.join(process.cwd(), "public", rel.replace(/^\//, ""));
  const frauncesPath = path.join(process.cwd(), "public", "fonts", "Fraunces.ttf");
  const frauncesSemiBoldPath = path.join(process.cwd(), "public", "fonts", "Fraunces144pt-SemiBold.woff");
  const frauncesItalicPath = path.join(process.cwd(), "public", "fonts", "Fraunces144pt-Italic.woff");
  const spaceGroteskPath = path.join(process.cwd(), "public", "fonts", "SpaceGrotesk.ttf");
  const bgBuffer = await readFile(bgPath);
  const bgDataUri = `data:image/png;base64,${bgBuffer.toString("base64")}`;

  const svg = buildCardSvg(persona, source, bgDataUri);
  const png = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1080,
    },
    font: {
      fontFiles: [frauncesSemiBoldPath, frauncesItalicPath, frauncesPath, spaceGroteskPath],
      loadSystemFonts: true,
      defaultFontFamily: "Space Grotesk",
      sansSerifFamily: "Space Grotesk",
      serifFamily: "Fraunces 144pt",
    },
  })
    .render()
    .asPng();

  return { svg, png };
}
