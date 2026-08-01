import { Spinner } from "@/components/ui/Spinner";

export type MirrorFlowState =
  | "idle"
  | "creating"
  | "waiting"
  | "reading"
  | "persona"
  | "rendering"
  | "ready"
  | "error";

const copy: Record<Exclude<MirrorFlowState, "ready" | "error">, string> = {
  idle: "Ready when you are.",
  creating: "Opening the Vana handoff.",
  waiting: "Waiting for approval in the other tab.",
  reading: "Reading the patterns in your taste.",
  persona: "Turning habits into a sharper persona.",
  rendering: "Composing your card.",
};

function readingCopy(source?: "spotify" | "youtube" | "both") {
  if (source === "spotify") return "reading your questionable 3am playlist choices...";
  if (source === "youtube") return "counting how many hours you've spent in one rabbit hole...";
  if (source === "both") return "cross-checking your playlists against your rabbit holes...";
  return copy.reading;
}

export function ConnectionStatus({
  state,
  error,
  activeSource,
}: {
  state: MirrorFlowState;
  error?: string;
  activeSource?: "spotify" | "youtube" | "both";
}) {
  if (state === "ready") return <p className="status ok">Persona card ready.</p>;
  if (state === "error") return <p className="status err">{error ?? "Something broke."}</p>;

  return (
    <p className="status">
      {state !== "idle" && <Spinner />} {state === "reading" ? readingCopy(activeSource) : copy[state]}
    </p>
  );
}
