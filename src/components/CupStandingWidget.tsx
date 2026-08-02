import Link from "next/link";
import { getCupStanding } from "@/lib/store/kv";

export async function CupStandingWidget() {
  const standing = await getCupStanding().catch(() => ({
    rank: null,
    goals: 0,
    assists: 0,
    points: 0,
    updatedAt: "not posted",
  }));
  const rank = standing.rank ? `#${standing.rank}` : "not posted";

  return (
    <aside className="standingWidget" aria-label="Mirror Vana Cup standing">
      <span>Mirror Cup standing</span>
      <strong>{rank}</strong>
      <span>
        {standing.goals} goals · {standing.assists} assists · {standing.points} pts
      </span>
      <span>updated {standing.updatedAt}</span>
      <Link href="/leaderboard">Referral leaderboard</Link>
    </aside>
  );
}
