"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  onConnectChatgpt: () => void;
};

export function ConnectButtons({ onConnectChatgpt }: Props) {
  return (
    <div className="ctaRow">
      <Button onClick={onConnectChatgpt}>Connect ChatGPT</Button>
      <Button href="/claude-upload">Connect Claude</Button>
    </div>
  );
}
