"use client";

import Image from "next/image";
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
        <Image className="buttonLogo" src="/spotify.png" alt="" width={22} height={22} unoptimized />
        <span>{connected.spotify ? "Spotify connected" : "Connect Spotify"}</span>
      </Button>
      <Button className="youtubeButton" onClick={() => onConnect("youtube", openApprovalTab())} disabled={disabled || busySource === "youtube"}>
        <Image className="buttonLogo" src="/youtube.png" alt="" width={22} height={22} unoptimized />
        <span>{connected.youtube ? "YouTube connected" : "Connect YouTube"}</span>
      </Button>
    </div>
  );
}
