"use client";

import { useEffect, useState } from "react";

type Item = { cardId: string; archetype: string; source: string };

export function LiveTicker() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch("/api/ticker");
      if (!res.ok || !active) return;
      const json = await res.json();
      setItems(json.items ?? []);
    }
    void load();
    const interval = setInterval(() => void load(), 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (!items.length) {
    return (
      <div className="ticker">
        <span className="tickerDot" aria-hidden="true" />
        <span className="tickerViewport">New cards appear here once the feed warms up.</span>
      </div>
    );
  }

  const visible = items.slice(0, 8).map((item) => `${item.archetype} (${item.source})`);
  const ticker = [...visible, ...visible];
  return (
    <div className="ticker" aria-label={`Recent cards: ${visible.join(", ")}`}>
      <span className="tickerDot" aria-hidden="true" />
      <span className="tickerViewport">
        <span className="tickerTrack" aria-hidden="true">
          {ticker.map((item, index) => (
            <span className="tickerItem" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}
