"use client";

import Image from "next/image";
import { useRef } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { paletteAccent, paletteFile, paletteMuted, paletteText } from "@/lib/card/palette";
import type { PersonaResult } from "@/lib/persona/types";
import { cardSourceLabel, sourcesFromCardSource, type MirrorCardSource, type MirrorSource } from "@/lib/vana/constants";

type Props = {
  cardImageUrl?: string;
  persona?: PersonaResult | null;
  source?: MirrorCardSource;
};

function sourceLogos(source: MirrorCardSource) {
  const logos: Record<MirrorSource, { src: string; alt: string }> = {
    instagram: { src: "/instagram.svg", alt: "Instagram" },
    youtube: { src: "/youtube.png", alt: "YouTube" },
    spotify: { src: "/spotify.png", alt: "Spotify" },
  };
  return sourcesFromCardSource(source).map((item) => logos[item]);
}

export function PersonaCard({ cardImageUrl, persona, source = "spotify" }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    const strength = event.pointerType === "mouse" ? 9 : 5;
    card.style.setProperty("--tilt-x", `${(-py * strength).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${(px * strength).toFixed(2)}deg`);
    card.style.setProperty("--glare-x", `${(50 - px * 46).toFixed(2)}%`);
    card.style.setProperty("--glare-y", `${(50 - py * 46).toFixed(2)}%`);
  }

  function onPointerLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--glare-x", "50%");
    card.style.setProperty("--glare-y", "50%");
  }

  if (cardImageUrl) {
    return (
      <div className="cardTilt" ref={cardRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} onPointerCancel={onPointerLeave}>
        <Image
          src={cardImageUrl}
          alt="Generated Mirror card"
          className="cardImage"
          width={540}
          height={675}
          unoptimized
          priority
        />
        <span className="cardGlare" aria-hidden="true" />
      </div>
    );
  }

  if (!persona) return null;
  const energy = Math.max(0, Math.min(100, Math.round(persona.energyScore)));
  const accent = paletteAccent[persona.colorFamily];
  const text = paletteText[persona.colorFamily];
  const muted = paletteMuted[persona.colorFamily];
  const cardStyle = {
    "--card-accent": accent,
    "--card-text": text,
    "--card-muted": muted,
    backgroundImage: `url("${paletteFile[persona.colorFamily]}?v=ref-20260801")`,
  } as CSSProperties;

  return (
    <div
      className={`cardTilt cardLive cardLive-${persona.colorFamily}`}
      style={cardStyle}
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
    >
      <div className="cardLiveContent">
        <p className="cardSource" style={{ color: accent, fontFamily: '"Space Grotesk", Arial, sans-serif' }}>
          <span className="sourceMarks" aria-hidden="true">
            {sourceLogos(source).map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={logo.alt} src={logo.src} alt="" width={18} height={18} />
            ))}
          </span>
          {cardSourceLabel(source)} READ
        </p>
        <h2 className="revealText" style={{ color: text, fontFamily: '"Fraunces", Georgia, serif' }}>
          {persona.archetype}
        </h2>
        <p className="cardTagline revealText" style={{ color: text, fontFamily: '"Fraunces", Georgia, serif' }}>
          {persona.tagline}
        </p>
        <div className="energyHead">
          <span style={{ color: muted, fontFamily: '"Space Grotesk", Arial, sans-serif' }}>ENERGY</span>
          <strong style={{ color: text, fontFamily: '"Space Grotesk", Arial, sans-serif' }}>{energy}</strong>
        </div>
        <div className="meter cardMeter" aria-label={`Energy ${energy}`}>
          <span style={{ width: `${energy}%`, backgroundColor: accent }} />
        </div>
        <div className="previewList cardObsessions">
          <span style={{ color: accent, fontFamily: '"Space Grotesk", Arial, sans-serif' }}>Top obsessions</span>
          <ul className="cardObsessionList">
            {persona.topObsessions.slice(0, 3).map((item) => (
              <li key={item} style={{ color: text, fontFamily: '"Space Grotesk", Arial, sans-serif' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="cardPattern revealText" style={{ color: text, fontFamily: '"Fraunces", Georgia, serif' }}>
          {persona.weirdPattern}
        </p>
      </div>
      <span className="cardGlare" aria-hidden="true" />
    </div>
  );
}
