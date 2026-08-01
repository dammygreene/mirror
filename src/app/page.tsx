import Image from "next/image";
import Link from "next/link";
import { CupStandingWidget } from "@/components/CupStandingWidget";
import { HomeFlow } from "@/components/HomeFlow";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { PalettePreview } from "@/components/PalettePreview";
import { samplePersona } from "@/data/persona.fixture";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="landing">
      <InteractiveBackground />
      <header className="topBar">
        <Link className="brandLockup" href="/" aria-label="Mirror home">
          <Image className="logoImage logoImageLarge" src="/CLEAR.png" width={86} height={86} alt="" aria-hidden="true" />
          <span>MIRROR</span>
        </Link>
        <nav className="topLinks" aria-label="Mirror links">
          <Link className="leaderboardNavButton" href="/leaderboard" aria-label="Referral leaderboard">
            <span className="leaderboardFull">Referral leaderboard</span>
            <span className="leaderboardShort">Leaderboard</span>
          </Link>
        </nav>
      </header>

      <section className="heroGrid">
        <div className="heroCopy">
          <p className="eyebrow">Vana Cup 2026</p>
          <h1>What does your AI actually think of you?</h1>
          <p className="lede">
            Connect your ChatGPT or Claude history and get a collectible persona card: specific, a little too honest,
            and built from data you control.
          </p>
          <HomeFlow />
        </div>

        <aside className="previewStack" aria-label="Example Mirror persona card">
          <PalettePreview persona={samplePersona} />
        </aside>
      </section>

      <footer className="footerNote">
        <span>Powered by Vana - your data, your terms</span>
        <CupStandingWidget />
      </footer>
    </main>
  );
}
