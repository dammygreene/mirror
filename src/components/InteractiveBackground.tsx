"use client";

import { useEffect } from "react";
import type { PersonaColorFamily } from "@/lib/persona/types";

type PaletteDetail = {
  colorFamily: PersonaColorFamily;
  bg: string;
  rgb: string;
  accent: string;
  accentRgb: string;
};

const initial: PaletteDetail = {
  colorFamily: "violet",
  bg: "#1C1330",
  rgb: "28 19 48",
  accent: "#8F7AE0",
  accentRgb: "143 122 224",
};

function applyPalette(detail: PaletteDetail) {
  const root = document.documentElement;
  root.style.setProperty("--active-card-bg", detail.bg);
  root.style.setProperty("--active-card-rgb", detail.rgb);
  root.style.setProperty("--active-card-accent", detail.accent);
  root.style.setProperty("--active-card-accent-rgb", detail.accentRgb);
}

export function InteractiveBackground() {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    applyPalette(initial);

    function updatePointer(clientX: number, clientY: number) {
      if (media.matches) return;
      root.style.setProperty("--cursor-x", `${clientX}px`);
      root.style.setProperty("--cursor-y", `${clientY}px`);
      root.style.setProperty("--bg-shift-x", `${((window.innerWidth / 2 - clientX) * 0.018).toFixed(2)}px`);
      root.style.setProperty("--bg-shift-y", `${((window.innerHeight / 2 - clientY) * 0.018).toFixed(2)}px`);
      root.style.setProperty("--cursor-alpha", "1");
    }

    function onPointerMove(event: PointerEvent) {
      updatePointer(event.clientX, event.clientY);
    }

    function onTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      if (touch) updatePointer(touch.clientX, touch.clientY);
    }

    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (touch) updatePointer(touch.clientX, touch.clientY);
    }

    function onPalette(event: Event) {
      applyPalette((event as CustomEvent<PaletteDetail>).detail);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mirror:palette", onPalette);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mirror:palette", onPalette);
    };
  }, []);

  return <div className="interactiveBg" aria-hidden="true" />;
}
