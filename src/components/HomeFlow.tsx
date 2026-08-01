"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButtons } from "@/components/ConnectButtons";
import { ConnectionStatus, type MirrorFlowState } from "@/components/ConnectionStatus";
import { LiveTicker } from "@/components/LiveTicker";
import { Button } from "@/components/ui/Button";
import { cardSourceFromSources, hasTasteData, type MirrorSource, type NormalizedPayload } from "@/lib/vana/constants";

const readReadyStatuses = new Set(["approved", "ready_for_read"]);
const terminalFailureStatuses = new Set(["completed", "denied", "expired"]);

function flowError(reason: string) {
  return `that didn't work. ${reason}. try again`;
}

function dataCount(payload: NormalizedPayload) {
  return payload.spotify?.savedTracks.length ?? payload.youtube?.history.length ?? 0;
}

export function HomeFlow() {
  const [state, setState] = useState<MirrorFlowState>("idle");
  const [error, setError] = useState<string>();
  const [activeSource, setActiveSource] = useState<MirrorSource | "both">();
  const [connectedData, setConnectedData] = useState<Partial<Record<MirrorSource, NormalizedPayload>>>({});
  const router = useRouter();

  const connectedSources = useMemo(
    () => (["spotify", "youtube"] as MirrorSource[]).filter((source) => connectedData[source]),
    [connectedData],
  );
  const connected = {
    spotify: Boolean(connectedData.spotify),
    youtube: Boolean(connectedData.youtube),
  };

  async function runConnectFlow(source: MirrorSource) {
    try {
      setError(undefined);
      setActiveSource(source);
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
      if (dataCount(readJson) === 0) throw new Error(`Vana returned no ${source} data`);

      setConnectedData((current) => ({ ...current, [source]: readJson }));
      setState("idle");
    } catch (err) {
      setState("error");
      setError(flowError(err instanceof Error ? err.message : "Flow failed"));
    }
  }

  async function generateCard() {
    try {
      const input = {
        sources: connectedSources,
        spotify: connectedData.spotify?.spotify,
        youtube: connectedData.youtube?.youtube,
      };
      if (!hasTasteData(input)) throw new Error("connect Spotify or YouTube first");

      setError(undefined);
      setActiveSource(connectedSources.length > 1 ? "both" : connectedSources[0]);
      setState("persona");
      const sessionId = crypto.randomUUID();
      const source = cardSourceFromSources(connectedSources);
      const personaRes = await fetch("/api/persona/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...input }),
      });
      const personaJson = await personaRes.json();
      if (!personaRes.ok) throw new Error(personaJson.error ?? "Persona failed");

      setState("rendering");
      const renderRes = await fetch("/api/card/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          source,
          persona: personaJson.persona,
        }),
      });
      const renderJson = await renderRes.json();
      if (!renderRes.ok) throw new Error(renderJson.error ?? "Render failed");

      setState("ready");
      router.push(`/result/${sessionId}`);
    } catch (err) {
      setState("error");
      setError(flowError(err instanceof Error ? err.message : "Flow failed"));
    }
  }

  return (
    <>
      <ConnectButtons
        onConnect={runConnectFlow}
        connected={connected}
        busySource={state !== "idle" && activeSource !== "both" ? activeSource : undefined}
        disabled={state !== "idle" && state !== "error"}
      />
      {connectedSources.length > 0 && (
        <div className="generatePanel">
          <Button type="button" onClick={generateCard} disabled={state !== "idle" && state !== "error"}>
            Generate my card
          </Button>
          <p>
            {connectedSources.length === 1
              ? `Add ${connectedSources[0] === "spotify" ? "YouTube" : "Spotify"} too for a fuller read.`
              : "Spotify and YouTube are both connected."}
          </p>
        </div>
      )}
      <ConnectionStatus state={state} error={error} activeSource={activeSource} />
      <LiveTicker />
    </>
  );
}
