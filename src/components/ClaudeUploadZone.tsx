"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "uploading" | "processing" | "done" | "error";

const statusCopy: Record<Status, string> = {
  idle: "Select conversations.json",
  uploading: "Uploading export",
  processing: "Reading patterns",
  done: "Card ready",
  error: "Upload failed",
};

export function ClaudeUploadZone() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onFile(file: File) {
    try {
      setError("");
      setStatus("uploading");
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/claude/upload", { method: "POST", body: form });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error ?? "Upload failed");

      setStatus("processing");
      const sessionId = crypto.randomUUID();
      const writeRes = await fetch("/api/claude/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, conversations: uploadJson.conversations }),
      });
      const writeJson = await writeRes.json();
      if (!writeRes.ok) throw new Error(writeJson.error ?? "Write failed");

      const personaRes = await fetch("/api/persona/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, source: "claude", conversations: uploadJson.conversations }),
      });
      const personaJson = await personaRes.json();
      if (!personaRes.ok) throw new Error(personaJson.error ?? "Persona failed");

      const renderRes = await fetch("/api/card/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, source: "claude", persona: personaJson.persona }),
      });
      const renderJson = await renderRes.json();
      if (!renderRes.ok) throw new Error(renderJson.error ?? "Card render failed");

      setStatus("done");
      router.push(`/result/${sessionId}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div
      className="uploadBox"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) void onFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      <div>
        <p className="uploadKicker">conversations.json</p>
        <h2>{statusCopy[status]}</h2>
        <p>Your file is processed and discarded; only derived persona data is stored.</p>
      </div>
      <div className="uploadActions">
        <Button type="button" onClick={() => inputRef.current?.click()}>
          Browse file
        </Button>
        <Button href="/" className="secondaryButton">
          Back
        </Button>
      </div>
      {error && <p className="status err">{error}</p>}
    </div>
  );
}
