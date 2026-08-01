"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  onConnectChatgpt: () => void;
};

export function ConnectButtons({ onConnectChatgpt }: Props) {
  return (
    <div className="ctaRow">
      <Button onClick={onConnectChatgpt}>Connect ChatGPT - 30 seconds</Button>
      <Button href="/claude-upload" className="secondaryButton">
        Connect Claude - ~5 min
      </Button>
    </div>
  );
}
