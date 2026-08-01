"use client";

import { Button } from "@/components/ui/Button";

export function ShareBar({ cardId, cardImageUrl }: { cardId: string; cardImageUrl: string }) {
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${cardId}`;
  const shareText = encodeURIComponent("I generated my Mirror persona card on Vana Cup.");
  const xUrl = `https://x.com/intent/post?text=${shareText}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="shareBar">
      <Button href={cardImageUrl} download={`mirror-${cardId}.png`} target="_blank" rel="noreferrer">
        Download PNG
      </Button>
      <Button
        type="button"
        className="secondaryButton"
        onClick={async () => {
          await navigator.clipboard.writeText(shareUrl);
        }}
      >
        Copy Link
      </Button>
      <Button href={xUrl} target="_blank" rel="noreferrer" className="secondaryButton">
        Share on X
      </Button>
    </div>
  );
}
