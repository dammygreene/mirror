import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonaCard } from "@/components/PersonaCard";
import type { PersonaResult } from "@/lib/persona/types";
import { getCard } from "@/lib/store/kv";

export async function generateMetadata({ params }: { params: Promise<{ cardId: string }> }): Promise<Metadata> {
  const { cardId } = await params;
  const card = await getCard(cardId);
  if (!card) return {};

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const archetype = (card.persona as { archetype?: string }).archetype ?? "Persona";
  return {
    title: `Mirror Card - ${archetype}`,
    openGraph: {
      images: [`${site}/api/og/${cardId}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`${site}/api/og/${cardId}`],
    },
  };
}

export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  const card = await getCard(cardId);
  if (!card) notFound();
  const persona = card.persona as PersonaResult;

  return (
    <main className="subPage sharedPage">
      <header className="simpleTopBar">
        <Link className="brandLockup" href="/" aria-label="Mirror home">
          <Image className="logoImage logoImageSmall" src="/CLEAR.png" width={50} height={50} alt="" aria-hidden="true" />
          <span>MIRROR</span>
        </Link>
      </header>
      <section className="sharedCard">
        <PersonaCard persona={persona} source={card.source} />
      </section>
    </main>
  );
}
