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

const sources: Array<{ id: MirrorSource; label: string; icon: string }> = [
  { id: "instagram", label: "Instagram", icon: "/instagram.svg" },
  { id: "youtube", label: "YouTube", icon: "/youtube.png" },
  { id: "spotify", label: "Spotify", icon: "/spotify.png" },
];

export function ConnectButtons({ onConnect, connected = {}, busySource, disabled = false }: Props) {
  return (
    <div className="ctaRow">
      {sources.map((source) => (
        <Button
          key={source.id}
          className="sourceButton"
          onClick={() => onConnect(source.id, openApprovalTab())}
          disabled={disabled || busySource === source.id || connected[source.id]}
        >
          <Image className="buttonLogo" src={source.icon} alt="" width={22} height={22} unoptimized />
          <span>{connected[source.id] ? `${source.label} connected` : `Connect ${source.label}`}</span>
        </Button>
      ))}
    </div>
  );
}
