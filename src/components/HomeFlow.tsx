"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButtons } from "@/components/ConnectButtons";
import { ConnectionStatus, type MirrorFlowState } from "@/components/ConnectionStatus";
import { LiveTicker } from "@/components/LiveTicker";
import type { MirrorSource } from "@/lib/vana/constants";

const readReadyStatuses = new Set(["approved", "ready_for_read"]);
const terminalFailureStatuses = new Set(["completed", "denied", "expired"]);

function flowError(reason: string) {
  return `that didn't work. ${reason}. try again`;
}

export function HomeFlow() {
  const [state, setState] = useState<MirrorFlowState>("idle");
  const [error, setError] = useState<string>();
  const router = useRouter();

  async function runConnectFlow(source: MirrorSource) {
    try {
      setError(undefined);
      setState("creating");
      const reqRes = await fetch("/api/vana/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const reqJson = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqJson.error ?? "Failed to create request");
      if (!reqJson.requestId || !reqJson.approvalUrl) throw new Error("Vana did not return an approval URL");

      window.open(reqJson.approvalUrl, "_blank", "noopener,noreferrer");
      setState("waiting");

      let readReady = false;
      for (let i = 0; i < 80; i += 1) {
        await new Promise((r) => setTimeout(r, 1500));
        const statusRes = await fetch(
          `/api/vana/status?source=${encodeURIComponent(source)}&requestId=${encodeURIComponent(reqJson.requestId)}`,
        );
        const statusJson = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusJson.error ?? "Approval status check failed");
        if (readReadyStatuses.has(statusJson.status)) {
          readReady = true;
          break;
        }
        if (terminalFailureStatuses.has(statusJson.status)) {
          throw new Error(`approval ${statusJson.status}`);
        }
      }
      if (!readReady) throw new Error("approval timed out");

      setState("reading");
      const readRes = await fetch(
        `/api/vana/read?source=${encodeURIComponent(source)}&requestId=${encodeURIComponent(reqJson.requestId)}`,
      );
      const readJson = await readRes.json();
      if (!readRes.ok) throw new Error(readJson.error ?? "Read failed");
      if (!Array.isArray(readJson.conversations) || readJson.conversations.length === 0) {
        throw new Error("Vana returned no conversations");
      }

      setState("persona");
      const personaRes = await fetch("/api/persona/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: reqJson.sessionId,
          source,
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
          source,
          persona: personaJson.persona,
        }),
      });
      const renderJson = await renderRes.json();
      if (!renderRes.ok) throw new Error(renderJson.error ?? "Render failed");

      setState("ready");
      router.push(`/result/${reqJson.sessionId}`);
    } catch (err) {
      setState("error");
      setError(flowError(err instanceof Error ? err.message : "Flow failed"));
    }
  }

  return (
    <>
      <ConnectButtons onConnect={runConnectFlow} />
      <ConnectionStatus state={state} error={error} />
      <LiveTicker />
    </>
  );
}
