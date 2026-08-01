"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButtons } from "@/components/ConnectButtons";
import { ConnectionStatus, type MirrorFlowState } from "@/components/ConnectionStatus";
import { LiveTicker } from "@/components/LiveTicker";

export function HomeFlow() {
  const [state, setState] = useState<MirrorFlowState>("idle");
  const [error, setError] = useState<string>();
  const router = useRouter();

  async function runChatgptFlow() {
    try {
      setError(undefined);
      setState("creating");
      const reqRes = await fetch("/api/vana/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "chatgpt" }),
      });
      const reqJson = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqJson.error ?? "Failed to create request");

      window.open(reqJson.approvalUrl, "_blank", "noopener,noreferrer");
      setState("waiting");

      let approved = false;
      for (let i = 0; i < 15; i += 1) {
        await new Promise((r) => setTimeout(r, 900));
        const statusRes = await fetch(`/api/vana/status?requestId=${reqJson.requestId}`);
        const statusJson = await statusRes.json();
        if (statusJson.status === "approved") {
          approved = true;
          break;
        }
      }
      if (!approved) throw new Error("Approval timed out");

      setState("reading");
      const readRes = await fetch(`/api/vana/read?source=chatgpt&sessionId=${reqJson.sessionId}`);
      const readJson = await readRes.json();
      if (!readRes.ok) throw new Error(readJson.error ?? "Read failed");

      setState("persona");
      const personaRes = await fetch("/api/persona/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: reqJson.sessionId,
          source: "chatgpt",
          conversations: readJson.conversations,
        }),
      });
      const personaJson = await personaRes.json();
      if (!personaRes.ok) throw new Error(personaJson.error ?? "Persona failed");

      setState("rendering");
      const renderRes = await fetch("/api/card/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: reqJson.sessionId,
          source: "chatgpt",
          persona: personaJson.persona,
        }),
      });
      const renderJson = await renderRes.json();
      if (!renderRes.ok) throw new Error(renderJson.error ?? "Render failed");

      setState("ready");
      router.push(`/result/${reqJson.sessionId}`);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Flow failed");
    }
  }

  return (
    <>
      <ConnectButtons onConnectChatgpt={runChatgptFlow} />
      <ConnectionStatus state={state} error={error} />
      <LiveTicker />
    </>
  );
}
