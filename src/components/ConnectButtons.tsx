"use client";

import { Button } from "@/components/ui/Button";
import type { MirrorSource } from "@/lib/vana/constants";

type Props = {
  onConnect: (source: MirrorSource, approvalTab: Window | null) => void;
  connected?: Partial<Record<MirrorSource, boolean>>;
  busySource?: MirrorSource;
  disabled?: boolean;
};

function openApprovalTab() {
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  return tab;
}

export function ConnectButtons({ onConnect, connected = {}, busySource, disabled = false }: Props) {
  return (
    <div className="ctaRow">
      <Button className="spotifyButton" onClick={() => onConnect("spotify", openApprovalTab())} disabled={disabled || busySource === "spotify"}>
        {connected.spotify ? "Spotify connected" : "Connect Spotify"}
      </Button>
      <Button className="youtubeButton" onClick={() => onConnect("youtube", openApprovalTab())} disabled={disabled || busySource === "youtube"}>
        {connected.youtube ? "YouTube connected" : "Connect YouTube"}
      </Button>
    </div>
  );
}
