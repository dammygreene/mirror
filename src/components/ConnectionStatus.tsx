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
  reading: "Reading the patterns behind the prompts.",
  persona: "Turning habits into a sharper persona.",
  rendering: "Composing your card.",
};

export function ConnectionStatus({ state, error }: { state: MirrorFlowState; error?: string }) {
  if (state === "ready") return <p className="status ok">Persona card ready.</p>;
  if (state === "error") return <p className="status err">{error ?? "Something broke."}</p>;

  return (
    <p className="status">
      {state !== "idle" && <Spinner />} {copy[state]}
    </p>
  );
}
