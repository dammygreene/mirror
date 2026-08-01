"use client";

import { Button } from "@/components/ui/Button";
import type { MirrorSource } from "@/lib/vana/constants";

type Props = {
  onConnect: (source: MirrorSource) => void;
  connected?: Partial<Record<MirrorSource, boolean>>;
  busySource?: MirrorSource;
  disabled?: boolean;
};

export function ConnectButtons({ onConnect, connected = {}, busySource, disabled = false }: Props) {
  return (
    <div className="ctaRow">
      <Button className="spotifyButton" onClick={() => onConnect("spotify")} disabled={disabled || busySource === "spotify"}>
        {connected.spotify ? "Spotify connected" : "Connect Spotify"}
      </Button>
      <Button className="youtubeButton" onClick={() => onConnect("youtube")} disabled={disabled || busySource === "youtube"}>
        {connected.youtube ? "YouTube connected" : "Connect YouTube"}
      </Button>
    </div>
  );
}
