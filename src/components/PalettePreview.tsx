"use client";

import { useEffect, useMemo, useState } from "react";
import { PersonaCard } from "@/components/PersonaCard";
import type { PersonaColorFamily, PersonaResult } from "@/lib/persona/types";

const paletteNames: PersonaColorFamily[] = ["crimson", "violet", "emerald", "amber", "cyan"];
const paletteMeta: Record<PersonaColorFamily, { bg: string; rgb: string; accent: string; accentRgb: string }> = {
  crimson: { bg: "#2B0F12", rgb: "43 15 18", accent: "#E2544D", accentRgb: "226 84 77" },
  violet: { bg: "#1C1330", rgb: "28 19 48", accent: "#8F7AE0", accentRgb: "143 122 224" },
  emerald: { bg: "#0E2318", rgb: "14 35 24", accent: "#3FB681", accentRgb: "63 182 129" },
  amber: { bg: "#2A1C05", rgb: "42 28 5", accent: "#E6A13A", accentRgb: "230 161 58" },
  cyan: { bg: "#0B2226", rgb: "11 34 38", accent: "#3BC4D9", accentRgb: "59 196 217" },
};

export function PalettePreview({ persona }: { persona: PersonaResult }) {
  const [colorFamily, setColorFamily] = useState<PersonaColorFamily>(persona.colorFamily);
  const previewPersona = useMemo(() => ({ ...persona, colorFamily }), [persona, colorFamily]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("mirror:palette", {
        detail: {
          colorFamily,
          ...paletteMeta[colorFamily],
        },
      }),
    );
  }, [colorFamily]);

  return (
    <div className="palettePreview">
      <PersonaCard persona={previewPersona} source="spotify-youtube" />
      <div className="paletteStrip previewPaletteStrip" aria-label="Card color family">
        {paletteNames.map((name) => (
          <button
            key={name}
            type="button"
            className={`swatch ${name}`}
            style={{
              color: paletteMeta[name].accent,
            }}
            aria-label={`Use ${name} card color`}
            aria-pressed={colorFamily === name}
            title={name}
            onClick={() => setColorFamily(name)}
          >
            <span className="swatchColor" style={{ backgroundColor: paletteMeta[name].accent }} />
          </button>
        ))}
      </div>
    </div>
  );
}
