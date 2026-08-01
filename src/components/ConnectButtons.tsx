"use client";

import { Button } from "@/components/ui/Button";
import type { MirrorSource } from "@/lib/vana/constants";

type Props = {
  onConnect: (source: MirrorSource) => void;
};

export function ConnectButtons({ onConnect }: Props) {
  return (
    <div className="ctaRow">
      <Button onClick={() => onConnect("chatgpt")}>Connect ChatGPT</Button>
      <Button onClick={() => onConnect("claude")}>Connect Claude</Button>
    </div>
  );
}
