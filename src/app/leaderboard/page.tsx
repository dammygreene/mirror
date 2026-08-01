import Image from "next/image";
import Link from "next/link";
import { listReferrers } from "@/lib/store/kv";

const winnerPrize = Number(process.env.MIRROR_CUP_WINNER_VANA ?? 5000);
const placePrize = Number(process.env.MIRROR_CUP_PLACE_VANA ?? 500);
const vanaPriceUsd = Number(process.env.MIRROR_VANA_PRICE_USD ?? 1.18);
const vanaPriceDate = process.env.MIRROR_VANA_PRICE_DATE ?? "August 1, 2026";

export const dynamic = "force-dynamic";

function fmt(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

export default async function LeaderboardPage() {
  const referrers = await listReferrers(100);
  const totalShares = Math.max(
    1,
    referrers.reduce((sum, referrer) => sum + referrer.referredCount, 0),
  );
  const winnerPerShare = winnerPrize / totalShares;
  const placePerShare = placePrize / totalShares;

  return (
    <main className="subPage leaderboardPage">
      <header className="simpleTopBar">
        <Link className="brandLockup" href="/" aria-label="Mirror home">
          <Image className="logoImage logoImageSmall" src="/CLEAR.png" width={50} height={50} alt="" aria-hidden="true" />
          <span>MIRROR</span>
        </Link>
      </header>

      <section className="leaderboardHero">
        <p className="eyebrow">Referral leaderboard</p>
        <h1>Bring someone in. Climb the board.</h1>
        <p className="lede">
          Referral credit only counts when someone completes a connection and generates a card. Clicks do not count.
        </p>
      </section>

      <section className="leaderboardGrid">
        <div className="leaderboardPanel">
          <div className="panelHeader">
            <h2>Rankings</h2>
            <span>{totalShares} completed referral {totalShares === 1 ? "share" : "shares"}</span>
          </div>
          {referrers.length ? (
            <ol className="rankList">
              {referrers.map((referrer, index) => (
                <li key={referrer.referralCode}>
                  <span className="rank">#{index + 1}</span>
                  <strong>@{referrer.handle}</strong>
                  <span>{referrer.referredCount} referrals</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="emptyState">No completed referrals yet. The board starts moving once shared links turn into cards.</p>
          )}
        </div>

        <div className="projectionPanel">
          <div className="projectionCards">
            <div>
              <span>IF MIRROR WINS THE CUP</span>
              <strong>~{fmt(winnerPerShare)} VANA</strong>
              <p>about ${fmt(winnerPerShare * vanaPriceUsd)}</p>
              <small>per share</small>
            </div>
            <div>
              <span>IF MIRROR PLACES 2ND-5TH</span>
              <strong>~{fmt(placePerShare)} VANA</strong>
              <p>about ${fmt(placePerShare * vanaPriceUsd)}</p>
              <small>per share</small>
            </div>
          </div>
          <p>
            These figures assume {totalShares} people holding one share each (one share = one completed referral). Real
            growth adds shares, which lowers the amount per share — treat these as a ceiling, not a promise.
            Second-through-fifth pays a fraction of first place because the Cup prize itself does. Dollar figures use a
            VANA price of ${fmt(vanaPriceUsd)} on {vanaPriceDate} and are shown only to give a sense of scale — the
            actual payout, if any, would be in VANA, and its price moves. This is a projection, not a commitment: Mirror
            has made no binding obligation to distribute Cup winnings.
          </p>
        </div>
      </section>
    </main>
  );
}
