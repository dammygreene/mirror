"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const PENDING_VANA_REQUEST_KEY = "mirror:pending-vana-request";
const VANA_RETURN_RESULT_KEY = "mirror:vana-return-result";
const FAILURE_STATUSES = new Set(["denied", "expired", "failed", "failure", "error", "rejected"]);
const SUCCESS_STATUSES = new Set(["approved", "ready_for_read", "completed", "success", "succeeded"]);

type ReturnOutcome = "checking" | "success" | "failure" | "returned";

type PendingRequest = {
  requestId: string;
  source: string;
};

type Props = {
  query: Record<string, string>;
};

function readPendingRequest(): PendingRequest | null {
  try {
    const raw = window.localStorage.getItem(PENDING_VANA_REQUEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingRequest>;
    if (!parsed.requestId || !parsed.source) return null;
    return { requestId: parsed.requestId, source: parsed.source };
  } catch {
    return null;
  }
}

function statusFromQuery(query: Record<string, string>): ReturnOutcome | null {
  const values = Object.entries(query).map(([key, value]) => `${key}:${value}`.toLowerCase());
  if (values.some((value) => FAILURE_STATUSES.has(value.split(":").at(-1) ?? "") || value.includes("request failed"))) {
    return "failure";
  }
  if (values.some((value) => SUCCESS_STATUSES.has(value.split(":").at(-1) ?? ""))) {
    return "success";
  }
  return null;
}

function copyForOutcome(outcome: ReturnOutcome) {
  if (outcome === "checking") {
    return {
      eyebrow: "Vana approval",
      title: "Checking approval",
      body: "Mirror is confirming the latest result before returning you to the app.",
    };
  }
  if (outcome === "failure") {
    return {
      eyebrow: "Vana approval",
      title: "Request failed",
      body: "Vana did not approve this request. Return to Mirror to try again.",
    };
  }
  if (outcome === "success") {
    return {
      eyebrow: "Vana approval",
      title: "Approval received",
      body: "Mirror will continue the connection in the original tab.",
    };
  }
  return {
    eyebrow: "Vana approval",
    title: "Returned from Vana",
    body: "Mirror will verify the final request status in the original tab.",
  };
}

export function ReturnAutoClose({ query }: Props) {
  const [outcome, setOutcome] = useState<ReturnOutcome>("checking");
  const [showFallback, setShowFallback] = useState(false);
  const explicitOutcome = useMemo(() => statusFromQuery(query), [query]);
  const copy = copyForOutcome(outcome);

  useEffect(() => {
    let active = true;

    async function resolveOutcome() {
      if (explicitOutcome) {
        setOutcome(explicitOutcome);
        return;
      }

      const pending = readPendingRequest();
      if (!pending) {
        setOutcome("returned");
        return;
      }

      try {
        console.info("[Mirror Vana completion] return tab status-only check", {
          requestId: pending.requestId,
          source: pending.source,
          trigger: "return-status-only",
          timestamp: new Date().toISOString(),
        });
        const res = await fetch(
          `/api/vana/status?source=${encodeURIComponent(pending.source)}&requestId=${encodeURIComponent(
            pending.requestId,
          )}`,
        );
        const json = await res.json();
        if (!active) return;
        console.info("[Mirror Vana completion] return tab status-only result", {
          requestId: pending.requestId,
          source: pending.source,
          trigger: "return-status-only",
          status: json.status,
          timestamp: new Date().toISOString(),
        });
        if (!res.ok) {
          setOutcome("returned");
          return;
        }
        if (FAILURE_STATUSES.has(json.status)) {
          setOutcome("failure");
          return;
        }
        if (SUCCESS_STATUSES.has(json.status)) {
          setOutcome("success");
          return;
        }
        setOutcome("returned");
      } catch {
        if (active) setOutcome("returned");
      }
    }

    void resolveOutcome();

    return () => {
      active = false;
    };
  }, [explicitOutcome]);

  useEffect(() => {
    if (outcome === "checking") return;

    try {
      window.localStorage.setItem(VANA_RETURN_RESULT_KEY, JSON.stringify({ outcome, query, checkedAt: Date.now() }));
    } catch {
      // The origin tab still performs the authoritative status check.
    }

    const closeTimer = window.setTimeout(() => window.close(), 750);
    const fallbackTimer = window.setTimeout(() => setShowFallback(true), 1600);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [outcome, query]);

  return (
    <section className="returnContent" aria-labelledby="approval-title">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1 id="approval-title">{copy.title}</h1>
      <p className="lede">{copy.body}</p>
      {showFallback && (
        <Link className="mirrorButton" href="/">
          Return to app
        </Link>
      )}
    </section>
  );
}
