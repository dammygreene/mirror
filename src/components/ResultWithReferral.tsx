"use client";

import { useMemo, useState } from "react";
import { ReferralSignup } from "@/components/ReferralSignup";
import { ResultExperience } from "@/components/ResultExperience";
import type { PersonaResult } from "@/lib/persona/types";
import type { Referrer } from "@/lib/store/kv";
import type { MirrorCardSource } from "@/lib/vana/constants";

type Props = {
  cardId: string;
  sessionId: string;
  source: MirrorCardSource;
  persona: PersonaResult;
  initialReferrer?: Referrer | null;
};

export function ResultWithReferral({ cardId, sessionId, source, persona, initialReferrer = null }: Props) {
  const [referrer, setReferrer] = useState<Referrer | null>(initialReferrer);
  const referralUrl = useMemo(() => {
    if (!referrer || typeof window === "undefined") return "";
    return `${window.location.origin}/?ref=${referrer.referralCode}`;
  }, [referrer]);

  return (
    <>
      <ResultExperience cardId={cardId} source={source} persona={persona} referralUrl={referralUrl} />
      <ReferralSignup
        cardId={cardId}
        sessionId={sessionId}
        referrer={referrer}
        referralUrl={referralUrl}
        onReferrerChange={setReferrer}
      />
    </>
  );
}
