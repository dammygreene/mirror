# Feature addendum — Referral leaderboard (Mirror)

Give this to the agent alongside `vana-cup-app-blueprint.md` and `mirror-master-build-prompt.md`. This is an addition to the already-planned app, not a replacement — build it after the core connect/card flow works, per the existing build order.

## What it does

Every generated card gets a unique referral link. When someone new arrives via that link and completes their own connection (generates their own card), the referrer gets credit. A public leaderboard ranks people by referral count, alongside a transparent "what this could be worth" projection if Mirror places in the Cup — modeled on how the Patina project displays theirs: honest, caveated, no promises.

**Scope decision already made: bragging-rights only.** No wallet linking, no automated payout. If Mirror places well, payout happens manually after the Cup ends, out of band from this codebase.

## Data model

```ts
type Referrer = {
  handle: string;          // user-chosen, unique, becomes the leaderboard identity
  referralCode: string;    // short unique slug, auto-generated, used in share URLs (not necessarily == handle)
  referredCount: number;   // increments only on a COMPLETED connection, never on a click
  createdAt: string;
};

type ReferralEvent = {
  referralCode: string;    // whose link this credits
  newSessionId: string;    // the session that completed a connection via this link
  createdAt: string;
};
```

Store `Referrer` records keyed by `referralCode` in the existing KV store. `ReferralEvent` records exist mainly for dedupe/audit — before crediting, check no event already exists for that `newSessionId`, so a refresh or retry can't double-count the same person.

## Handle selection flow

- After someone's card is generated (on the result page, not before — don't front-load this before they've seen their own card), prompt: "Pick a handle to join the leaderboard" — short text input, profanity-filtered, uniqueness-checked against existing handles.
- This is optional — someone can download/share their card without ever picking a handle or appearing on the leaderboard. Don't gate the core product experience behind this.
- On handle creation, generate their `referralCode` and surface their personal share link: `mirror.xyz/c/[cardId]?ref=[referralCode]`.

## Attribution flow

1. Visitor arrives at `/` (or any page) with `?ref=[code]` in the URL. Store this in a short-lived cookie (session-scoped, not permanent) — this is the pending referral for whatever they do next.
2. Visitor completes the connect flow (ChatGPT or Claude, doesn't matter which) and their persona/card is successfully generated.
3. At that point — not before, so incomplete/abandoned sessions never count — check for the pending `ref` cookie. If present and valid (referral code exists, isn't the new session's own code, no existing `ReferralEvent` for this session), increment that referrer's `referredCount` and write the `ReferralEvent`.
4. Clear the cookie after crediting, so it can't be reused across multiple sessions in the same browser.

**Self-referral guard:** if a returning user somehow visits their own referral link, don't credit themselves — compare the incoming `ref` code against any referral code already associated with their current session before crediting.

## Leaderboard page (`/leaderboard`)

Two sections, matching the Patina reference's honesty-first framing:

**1. Rankings** — handle, rank, referral count. Simple table or ranked list, using the site's existing dark/warm-charcoal chrome, not a separate visual style.

**2. Projection panel** — two columns, same shape as the Patina screenshot:

```
┌─────────────────────────┬─────────────────────────┐
│ IF MIRROR WINS THE CUP  │ IF MIRROR PLACES 2ND-5TH│
│                          │                          │
│ ~[X] VANA                │ ~[Y] VANA                │
│ about $[Z]                │ about $[W]                │
│ per share                 │ per share                 │
└─────────────────────────┴─────────────────────────┘

These figures assume [N] people holding one share each (one
share = one completed referral). Real growth adds shares, which
lowers the amount per share — treat these as a ceiling, not a
promise. Second-through-fifth pays a fraction of first place
because the Cup prize itself does. Dollar figures use a VANA
price of $[price] on [date] and are shown only to give a sense
of scale — the actual payout, if any, would be in VANA, and its
price moves. This is a projection, not a commitment: Mirror has
made no binding obligation to distribute Cup winnings.
```

Compute `[X]`/`[Y]` from the Cup's actual current prize structure (winner ~5,000+ VANA growing, 2nd-5th at 500 VANA flat, per the Cup rules) divided by total current shares (total completed referrals across all referrers, minimum 1 to avoid divide-by-zero). Recompute live on page load, don't hardcode a snapshot — the whole point of the ceiling/floor framing is that it moves as more people join.

**That last disclaimer line matters as much as the numbers** — it's what keeps this an honest incentive display instead of an implied promise. Don't cut it for brevity.

## Vana Cup standing widget

A small persistent element (landing page footer or a `/status` page) showing Mirror's own current standing in the Cup: rank, goals, assists, points.

**Implementation note:** the official leaderboard at builders.vana.org is client-rendered, so there's no simple static fetch for this. Two paths:

- **Manual update (recommended for this timeline):** a simple admin-only route or even a hardcoded value you update by hand a few times a day, with a visible "last updated [timestamp]" note. Lower engineering risk, fully reliable, appropriate for a two-week build window.
- **Automated scrape (only if you have spare time):** a scheduled job using a headless browser to read the leaderboard page and extract Mirror's row, writing the result to KV on a schedule (e.g. every few hours). Higher effort, more fragile (breaks if the leaderboard's markup changes), only worth it if manual updates become a real burden.

Default to manual for now — note the automated path as a future upgrade, not a launch requirement.

## Build order (append to existing sequence)

Build this after the core ChatGPT connect flow is live and scoring — it's a growth multiplier on top of a working product, not a blocker to shipping the base app. Rough order:
1. Data model + KV wiring for `Referrer` / `ReferralEvent`
2. Handle-selection UI on the result page
3. `?ref=` cookie capture + crediting logic on successful card generation
4. `/leaderboard` page — rankings first, projection panel second
5. Standing widget (manual-update version)
