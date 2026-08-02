"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { Referrer } from "@/lib/store/kv";

type Props = {
  cardId: string;
  sessionId: string;
  initialReferrer?: Referrer | null;
};

export function ReferralSignup({ cardId, sessionId, initialReferrer = null }: Props) {
  const [handle, setHandle] = useState("");
  const [referrer, setReferrer] = useState<Referrer | null>(initialReferrer);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const shareUrl = useMemo(() => {
    if (!referrer || typeof window === "undefined") return "";
    return `${window.location.origin}/?ref=${referrer.referralCode}`;
  }, [referrer]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/referrals/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, sessionId, cardId }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "that handle did not work");
      return;
    }
    setReferrer(json.referrer);
  }

  if (referrer) {
    return (
      <section className="referralBox" aria-label="Referral link">
        <div>
          <p className="eyebrow">Leaderboard joined</p>
          <h2>@{referrer.handle}</h2>
          <p>Share this link. You get credit when someone new generates their own card.</p>
        </div>
        <div className="referralLink">{shareUrl}</div>
        <div className="shareBar">
          <Button type="button" onClick={() => navigator.clipboard.writeText(shareUrl)}>
            Copy link
          </Button>
          <Button href="/leaderboard" className="secondaryButton">
            View leaderboard
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="referralBox" aria-label="Join referral leaderboard">
      <div>
        <p className="eyebrow">Optional</p>
        <h2>Pick a handle to join the leaderboard</h2>
        <p>Downloads and sharing still work without this. A handle just gives you a referral link and a spot on the board.</p>
      </div>
      <form className="referralForm" onSubmit={submit}>
        <input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="your_handle"
          aria-label="Leaderboard handle"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={saving}>
          {saving ? "Checking" : "Join"}
        </Button>
      </form>
      {error && <p className="status err">{error}</p>}
    </section>
  );
}
