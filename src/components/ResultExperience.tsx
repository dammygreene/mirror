"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PersonaCard } from "@/components/PersonaCard";
import { Button } from "@/components/ui/Button";
import type { PersonaColorFamily, PersonaResult } from "@/lib/persona/types";
import type { MirrorCardSource } from "@/lib/vana/constants";

const paletteNames: PersonaColorFamily[] = ["crimson", "violet", "emerald", "amber", "cyan"];
const paletteAccent: Record<PersonaColorFamily, string> = {
  crimson: "#E2544D",
  violet: "#8F7AE0",
  emerald: "#3FB681",
  amber: "#E6A13A",
  cyan: "#3BC4D9",
};

type Props = {
  cardId: string;
  source: MirrorCardSource;
  persona: PersonaResult;
};

export function ResultExperience({ cardId, source, persona }: Props) {
  const [colorFamily, setColorFamily] = useState<PersonaColorFamily>(persona.colorFamily);
  const [downloading, setDownloading] = useState(false);
  const selectedPersona = useMemo(() => ({ ...persona, colorFamily }), [persona, colorFamily]);
  async function downloadSelected() {
    setDownloading(true);
    try {
      const res = await fetch("/api/card/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, persona: selectedPersona }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mirror-${cardId}-${colorFamily}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="resultHero">
      <div className="resultCopy">
        <p className="eyebrow">Card generated</p>
        <h1>Your Mirror card is ready.</h1>
        <p className="lede">
          Pick the color you want, download the PNG, then grab your referral link below if you want a spot on the board.
        </p>
        <div className="shareBar">
          <Button type="button" onClick={downloadSelected} disabled={downloading}>
            {downloading ? "Rendering PNG" : "Download selected PNG"}
          </Button>
        </div>
        <p className="helper">
          Someone else&apos;s data helped power this app. Yours can power the next one. <Link href="/">Learn more</Link>
        </p>
      </div>
      <div className="palettePreview resultPalettePreview">
        <PersonaCard persona={selectedPersona} source={source} />
        <div className="paletteStrip resultPaletteStrip" aria-label="Card color family">
          {paletteNames.map((name) => (
            <button
              key={name}
              type="button"
              className={`swatch ${name}`}
              style={{
                color: paletteAccent[name],
              }}
              aria-label={`Use ${name} card color`}
              aria-pressed={colorFamily === name}
              title={name}
              onClick={() => setColorFamily(name)}
            >
              <span className="swatchColor" style={{ backgroundColor: paletteAccent[name] }} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
