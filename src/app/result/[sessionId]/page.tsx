import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultWithReferral } from "@/components/ResultWithReferral";
import type { PersonaResult } from "@/lib/persona/types";
import { getCardBySession, getReferrerBySession } from "@/lib/store/kv";

export default async function ResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const card = await getCardBySession(sessionId);
  if (!card) notFound();
  const referrer = await getReferrerBySession(sessionId);

  const persona = card.persona as PersonaResult;
  return (
    <main className="subPage resultPage">
      <header className="simpleTopBar">
        <Link className="brandLockup" href="/" aria-label="Mirror home">
          <Image className="logoImage logoImageSmall" src="/CLEAR.png" width={50} height={50} alt="" aria-hidden="true" />
          <span>MIRROR</span>
        </Link>
      </header>
      <ResultWithReferral
        cardId={card.cardId}
        sessionId={sessionId}
        source={card.source}
        persona={persona}
        initialReferrer={referrer}
      />
    </main>
  );
}
