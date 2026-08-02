import { paletteAccent, paletteMuted, paletteText } from "./palette";
import type { PersonaResult } from "@/lib/persona/types";
import { cardSourceLabel, type MirrorCardSource } from "@/lib/vana/constants";

const W = 1080;
const H = 1350;
const CARD_RADIUS = 52;
const TEXT_X = 130;
const CONTENT_W = 820;

export type CardLogoData = {
  href: string;
  label: string;
};

function esc(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapText(text: string, maxChars: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  const clipped = lines.slice(0, maxLines);
  if (lines.length > maxLines) clipped[clipped.length - 1] = `${clipped[clipped.length - 1].replace(/[.,;:]$/, "")}...`;
  return clipped;
}

function textBlock({
  text,
  x,
  y,
  size,
  maxChars,
  maxLines,
  fill,
  weight = 500,
  lineHeight = 1.12,
  transform = "",
  family = "Fraunces, Georgia, serif",
  style = "normal",
}: {
  text: string;
  x: number;
  y: number;
  size: number;
  maxChars: number;
  maxLines: number;
  fill: string;
  weight?: number;
  lineHeight?: number;
  transform?: string;
  family?: string;
  style?: string;
}) {
  return `<text x="${x}" y="${y}" font-size="${size}" font-style="${style}" font-weight="${weight}" font-family="${family}" fill="${fill}" ${transform}>${wrapText(
    text,
    maxChars,
    maxLines,
  )
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : size * lineHeight}">${esc(line)}</tspan>`)
    .join("")}</text>`;
}

export function buildCardSvg(
  persona: PersonaResult,
  source: MirrorCardSource,
  backgroundDataUri: string,
  logos: CardLogoData[] = [],
) {
  const accent = paletteAccent[persona.colorFamily];
  const text = paletteText[persona.colorFamily];
  const muted = paletteMuted[persona.colorFamily];
  const safeEnergy = Math.max(0, Math.min(100, Math.round(persona.energyScore)));
  const meterWidth = Math.round((safeEnergy / 100) * CONTENT_W);
  const obsessions = persona.topObsessions
    .slice(0, 3)
    .map(
      (obs, index) =>
        `<g transform="translate(${TEXT_X} ${842 + index * 46})">
          <circle cx="6" cy="-10" r="5" fill="${accent}"/>
          <text x="28" y="0" font-size="28" font-weight="400" font-family="Space Grotesk, Arial, Helvetica, sans-serif" fill="${text}">${esc(
          obs,
        )}</text>
        </g>`,
    );
  const sourceLogos = logos
    .slice(0, 3)
    .map(
      (logo, index) =>
        `<image href="${logo.href}" x="${TEXT_X + index * 34}" y="325" width="27" height="27" preserveAspectRatio="xMidYMid meet"><title>${esc(
          logo.label,
        )}</title></image>`,
    )
    .join("");
  const logoCount = Math.min(logos.length, 3);
  const labelX = TEXT_X + (logoCount ? logoCount * 34 + 8 : 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <clipPath id="cardClip"><rect x="0" y="0" width="${W}" height="${H}" rx="${CARD_RADIUS}" ry="${CARD_RADIUS}" /></clipPath>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.22"/>
      </filter>
    </defs>
    <g clip-path="url(#cardClip)">
      <image href="${backgroundDataUri}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" />
      ${sourceLogos}
      <text x="${labelX}" y="346" font-size="25" font-weight="600" letter-spacing="5" font-family="Space Grotesk, Arial, Helvetica, sans-serif" fill="${accent}">${cardSourceLabel(source)} READ</text>
      ${textBlock({
        text: persona.archetype.toUpperCase(),
        x: TEXT_X,
        y: 446,
        size: 66,
        maxChars: 19,
        maxLines: 3,
        fill: text,
        weight: 600,
        lineHeight: 1.02,
        transform: 'filter="url(#shadow)"',
      })}
      ${textBlock({
        text: persona.tagline,
        x: TEXT_X,
        y: 628,
        size: 31,
        maxChars: 40,
        maxLines: 3,
        fill: text,
        weight: 400,
        lineHeight: 1.22,
        style: "italic",
      })}
      <text x="${TEXT_X}" y="736" font-size="23" font-weight="600" letter-spacing="5" font-family="Space Grotesk, Arial, Helvetica, sans-serif" fill="${muted}">ENERGY</text>
      <text x="950" y="736" text-anchor="end" font-size="26" font-weight="600" font-family="Space Grotesk, Arial, Helvetica, sans-serif" fill="${text}">${safeEnergy}</text>
      <rect x="${TEXT_X}" y="762" width="${CONTENT_W}" height="14" rx="7" fill="rgba(255, 255, 255, 0.15)"/>
      <rect x="${TEXT_X}" y="762" width="${meterWidth}" height="14" rx="7" fill="${accent}"/>
      <text x="${TEXT_X}" y="812" font-size="23" font-weight="600" letter-spacing="5" font-family="Space Grotesk, Arial, Helvetica, sans-serif" fill="${accent}">TOP OBSESSIONS</text>
      ${obsessions.join("\n")}
      ${textBlock({
        text: persona.weirdPattern,
        x: TEXT_X,
        y: 1010,
        size: 26,
        maxChars: 48,
        maxLines: 3,
        fill: text,
        weight: 400,
        lineHeight: 1.28,
        style: "italic",
      })}
    </g>
  </svg>`;
}
