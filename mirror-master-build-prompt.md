# Master build prompt — Mirror (Vana Cup entry)

Give this single document to your coding agent. It replaces the earlier separate blueprint and design-prompt docs — everything needed to build the app end to end lives here.

---

## 0. What you're building

**Mirror** (mirror.xyz) — a web app where a person connects either their ChatGPT or Claude conversation history through Vana's Data Portability protocol and gets back an AI-generated "persona card": a visual, shareable snapshot of who their AI thinks they are. Built for the Vana Cup (ends 18 August 2026, 23:59 UTC) — every new connection scores a goal, and the resulting persona data is written back to Vana in a clean, reusable shape so other apps on the network can plausibly read it (an assist).

The product has two halves: getting someone from "never heard of this" to "connected" as painlessly as possible, and the card itself, which has to be good enough that people screenshot and share it unprompted. Design and build for the second half's quality bar — the site around it exists to get people there fast, not to be impressive on its own.

---

## 1. Brand system — fixed, do not re-derive

These are final decisions based on real designed assets. Treat every value below as a hard constraint, not a suggestion.

### Domain
`mirror.xyz`

### Card format
1080×1350px portrait PNG, rendered server-side via Satori (React/JSX → SVG → PNG through `@resvg/resvg-js`).

**Corner radius:** large, soft rounding — roughly 48-56px at this canvas size (proportionally, about 4-5% of the card width). This is bigger than a typical UI card radius; it's part of what makes the card feel like a collectible object rather than a dashboard tile. If the agent building this can inspect the actual reference PNGs, measure and match exactly rather than using the estimate above.

**Padding:** consistent inset on all sides, roughly 64-72px at 1080px canvas width, matching the top-bar logo's distance from the card edge in the reference designs.

### The five palettes (exact, no others)

| Name | Background | Accent | Text | Text muted |
|---|---|---|---|---|
| crimson | `#2B0F12` | `#E2544D` | `#F7E7E5` | `#B08782` |
| violet | `#1C1330` | `#8F7AE0` | `#EEE9FB` | `#8F87AD` |
| emerald | `#0E2318` | `#3FB681` | `#E4F5EC` | `#7FA593` |
| amber | `#2A1C05` | `#E6A13A` | `#FAEED9` | `#A8956F` |
| cyan | `#0B2226` | `#3BC4D9` | `#E2F7FA` | `#7EA5AB` |

**Known contrast issue to fix during build:** in `amber`, the accent stroke color and the muted footer text sit close together in luminance. When laying out the footer and any amber-accented body text, check contrast explicitly (aim for WCAG AA, 4.5:1 for body text) rather than assuming the token values are automatically safe — bump `textMuted` lighter for amber specifically if needed.

### Logo mark
Two mirrored trapezoid panels ("mirror shards") side by side, each containing a diagonal stripe running in *opposite* directions (not a mirrored copy of the same stripe — this asymmetry is the point: two reflections that don't quite match). Rendered in the palette's accent color against the card's dark background, sitting directly left of the wordmark "MIRROR" in the top bar. The two panels double as a nod to the two connect paths (ChatGPT / Claude) — same mark family, two slightly different reflections.

Build this as a proper SVG/path asset (not a placeholder icon) sized to sit cleanly at both the card's top-bar scale (~28-32px tall) and favicon scale (32px, 16px) — test it small before finalizing, thin details disappear fast at 16px.

### Fonts
- **Fraunces** — display face. Used for anything that's an engine-filled "reveal": archetype (weight 600), tagline and weird-pattern quote (italic 400).
- **Space Grotesk** — structural face. Used for the wordmark (weight 500), footer, section labels, obsession list body text (weight 400).
- Both from Google Fonts — static (non-variable) weight files, since Satori cannot consume variable fonts. Download the specific weight files needed rather than the variable family.

### Footer copy
`mirror.xyz` (left) · `vana cup 2026` (right) — lowercase, small, muted-color text, per the reference designs.

### Card component code
The following files already exist and encode the palette/type system above — extend the app around them, do not rewrite the design decisions inside them:
- `src/lib/card/palette.ts`
- `src/lib/card/template.tsx`
- `src/lib/card/render.ts`
- `src/lib/persona/types.ts`

If the agent regenerates these from scratch, it must match: the five hex values exactly, the Fraunces/Space Grotesk role split exactly, and update the corner radius and logo mark per this document (the original template.tsx used a smaller radius and a placeholder letter-in-a-box icon — both are superseded by the real designs referenced in §1).

---

## 2. System architecture

```
Browser (Next.js App Router)
  │
  ├─ Connect ChatGPT → Vana SDK access request → new tab approval on
  │  user's Personal Server → poll status → pay + read chatgpt.conversations
  │
  ├─ Connect Claude → user manually exports from claude.ai (Settings →
  │  Privacy → Export data) → uploads conversations.json/.zip → backend
  │  parses the parent_message_uuid tree into linear conversation order →
  │  maps to claude.conversations schema → writes to user's Personal
  │  Server → same read path as ChatGPT
  │
  └─ Both converge on:
        normalized { source, messages: [...] }
          → Persona Engine (Claude API call → structured PersonaResult JSON)
          → Card Renderer (Satori → SVG → PNG)
          → Result page + Share flow (download / copy link / share to X)
          → Permanent /c/[cardId] page with OG image for link unfurls
```

Build the persona engine and card renderer once, source-agnostic — they only ever see the normalized message shape, never ChatGPT- or Claude-specific structures directly.

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Runtime | Node.js 22+, Node runtime (not Edge — Vana SDK server calls and Satori aren't Edge-safe) |
| Vana integration | `@opendatalabs/vana-sdk`, forked from `vana-data-app-starter` |
| Persona LLM call | Anthropic API (Claude), structured JSON output only, no preamble |
| Card rendering | `satori` + `@resvg/resvg-js` |
| Storage | Vercel KV / Upstash Redis for card records and session state |
| Hosting | Vercel, or existing AWS EC2 setup — needs a long-lived Node process, not serverless/edge, per the starter's consume-once guarantees |
| Network | Moksha testnet first, then Vana mainnet |

---

## 4. Repository structure

```
mirror/
├── .env.local                # VANA_APP_PRIVATE_KEY, VANA_APP_URL, ANTHROPIC_API_KEY, KV creds
├── src/
│   ├── app/
│   │   ├── page.tsx                      # landing: connect buttons + ticker
│   │   ├── connect/return/page.tsx       # Vana's required approval-return page
│   │   ├── claude-upload/page.tsx        # single continuous upload flow
│   │   ├── result/[sessionId]/page.tsx   # generated card + share actions
│   │   ├── c/[cardId]/page.tsx           # permanent shareable card page
│   │   └── api/
│   │       ├── vana/{request,status,read}/route.ts
│   │       ├── claude/{upload,write}/route.ts
│   │       ├── persona/generate/route.ts
│   │       ├── card/{render,[cardId]}/route.ts
│   │       └── og/[cardId]/route.tsx
│   ├── lib/
│   │   ├── vana/           # from starter, mostly unchanged — see starter repo
│   │   ├── claude-export/
│   │   │   ├── parse.ts        # walk parent_message_uuid tree → flat messages
│   │   │   ├── to-schema.ts    # flat messages → claude.conversations schema
│   │   │   └── validate.ts
│   │   ├── persona/
│   │   │   ├── prompt.ts
│   │   │   ├── generate.ts
│   │   │   └── types.ts        # PersonaResult contract, already built
│   │   ├── card/
│   │   │   ├── palette.ts      # already built
│   │   │   ├── template.tsx    # already built — update radius/logo per §1
│   │   │   └── render.ts       # already built
│   │   └── store/kv.ts
│   ├── components/
│   │   ├── ConnectButtons.tsx      # deliberately asymmetric, see §7
│   │   ├── ClaudeUploadZone.tsx
│   │   ├── ConnectionStatus.tsx    # state copy, see §8
│   │   ├── LiveTicker.tsx          # signature element, see §7
│   │   ├── PersonaCard.tsx
│   │   └── ShareBar.tsx
│   └── data/persona.fixture.ts     # local dev fixture data
└── connectors/anthropic/           # Claude connector, contributed upstream to data-connectors
    ├── claude-import.json
    └── schemas/claude.conversations.json
```

---

## 5. Claude connector schema

```json
{
  "scope": "claude.conversations",
  "version": "1.0",
  "type": "object",
  "required": ["source", "collectedAt", "conversations"],
  "properties": {
    "source": { "const": "claude" },
    "collectedAt": { "type": "string", "format": "date-time" },
    "conversations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "title", "messages"],
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" },
          "messages": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["role", "text"],
              "properties": {
                "role": { "enum": ["human", "assistant"] },
                "text": { "type": "string" },
                "timestamp": { "type": "string", "format": "date-time" }
              }
            }
          }
        }
      }
    }
  }
}
```

The claude.ai export ships as a linked list (each message has a `parent_message_uuid`) — `parse.ts` must walk that structure into linear per-conversation order before mapping to this schema.

---

## 6. Persona engine contract

**Input:**
```ts
type PersonaEngineInput = {
  source: 'chatgpt' | 'claude';
  conversations: Array<{
    title?: string;
    messages: Array<{ role: 'user' | 'assistant'; text: string; timestamp?: string }>;
  }>;
};
```

**Output (must pass `isValidPersonaResult` before reaching the renderer):**
```ts
type PersonaResult = {
  source: 'chatgpt' | 'claude';
  archetype: string;             // 2-3 words
  tagline: string;                // one sentence, roast-tier, sentence case, no terminal period
  topObsessions: [string, string, string];
  weirdPattern: string;            // specific, funny, paraphrased — never a verbatim quote
  energyScore: number;             // 0-100 integer
  colorFamily: 'crimson' | 'violet' | 'emerald' | 'amber' | 'cyan';
};
```

**Prompt principles:**
- Return only structured JSON, no preamble.
- Be specific, not generic — pull from actual recurring topics, not horoscope-style filler. Specificity is what makes the card feel like proof it read real data.
- Witty and roasting, never mean or stereotyping — "friend teasing you," not humiliation.
- Never quote message text verbatim in the output — privacy footgun and also keeps the copy writable rather than a transcript dump.
- Truncate/sample large histories (most recent N + longest M conversations) to control token cost and latency.
- `colorFamily` selection should feel earned, not random — encode a mapping from archetype tone to palette in the prompt itself (e.g. chaotic/late-night energy leans crimson or violet, calmer/analytical leans emerald or cyan).
- On validation failure, retry once with a stricter reminder of the schema before falling back to a safe default archetype — never surface a raw error to the user mid-flow.

---

## 7. Site design direction

**Philosophy:** the subject is an AI reading someone back to themselves and being unsettlingly, entertainingly accurate about it. Design for that specific moment, not for "AI persona generator" as a generic category.

**Explicitly avoid these three current AI-generated design defaults:**
1. Warm cream background (~`#F4F1EA`) with high-contrast serif and terracotta/clay accent (~`#D97757`).
2. Near-black background with one single bright acid-green or vermilion accent.
3. Broadsheet layout — hairline rules, zero border-radius, dense newspaper columns.

**Site chrome tokens (distinct from the card palettes):**
- Background: `#15141A` (warm charcoal, not pure black)
- Surface: `#1D1C24`
- Text primary: `#EDEBE6`
- Text secondary: `#8B8894`
- Border: `#2C2A34`
- **No single fixed site accent.** The five card accents rotate through hover states, focus rings, and the ticker's leading dots — this is the one deliberate risk, justified because the product's core mechanic literally is "which of five colors is your persona."

**Typography scale:** 15 / 17 / 21 / 28 / 44 / 72px. Use 72px once per page, for the hero line. Weights: 400 and 500/600 only — nothing heavier, it reads too corporate for this product.

**Layout concept:** not a conventional hero-with-stats template — more like approaching a small, slightly mysterious instrument. No stock illustration, no gradient mesh, no abstract 3D blob.

**Signature element — the live ticker:** a slim, continuously updating line beneath the hero CTAs showing recently generated archetypes as they happen (`"the 3am debugger" just generated`). Each line's leading dot uses one of the five accent colors, ideally matched to that card's real `colorFamily`. Seed with a fixed rotating placeholder list before real traffic exists; swap to live data via a lightweight polling endpoint once there's volume. Motion: one soft upward scroll/fade per new line, nothing bouncier — this is the only animated moment on the page. Respect `prefers-reduced-motion` by disabling scroll and swapping text instantly instead.

**No numbered steps (01/02/03) anywhere** — nothing in this product is a real sequence worth numbering.

---

## 8. Connect flow UX — do not style the two paths identically

ChatGPT is one click (new tab, approve, done — roughly 30 seconds). Claude requires leaving the site, running a manual export, waiting for an email, and returning to upload a file (~5 minutes, multiple steps). This gap must be visible in the UI, not hidden:

- **ChatGPT button:** primary visual weight, filled/solid, label includes "30 seconds."
- **Claude button:** secondary visual weight (outline, not filled), label includes a time estimate and an external-link indicator ("~5 min, ↗").
- **`/claude-upload` stays on one continuous screen** — instructions, a direct link out to `claude.ai/settings/privacy`, and the upload dropzone all visible at once, so the user never feels like they've left and have to "find their way back." Accept `.zip` uploads directly and unzip server-side — don't make them extract it manually.

**State copy** (use this register — active voice, specific, never a raw error string):

| State | Copy |
|---|---|
| creating request | "opening the door…" |
| waiting for approval | "waiting for you to approve, in the other tab" |
| reading (ChatGPT) | "reading way too many 3am prompts…" |
| reading (Claude) | "reading your export…" |
| generating persona | "figuring out who you actually are" |
| rendering card | "drawing your card" |
| ready | no status text — the card itself is the confirmation |
| error | "that didn't work. [specific reason]. try again" |

---

## 9. Page-by-page spec

- **`/`** — top bar (wordmark + logo mark + Discord link, nothing else), 72px hero line, two asymmetric connect buttons, live ticker below. No scroll required on a standard laptop viewport.
- **`/claude-upload`** — single continuous view per §8. Dropzone border uses `--border`, switches to an accent color on drag-over.
- **`/result/[sessionId]`** — full card display, three actions (download PNG / copy link / share to X), one quiet text-link nodding at the network effect ("someone else's data helped power this app — yours can power the next one").
- **`/c/[cardId]`** — same card, minimal chrome, correct OG meta pointing at `/api/og/[cardId]` so link previews show the actual card. Load fast — this is often a stranger's first touchpoint.
- Connection status renders inline on whichever page triggered the flow — never a separate loading route.

---

## 10. Build order

1. Set up the site design token system (§7) before building any page.
2. Build the landing page static layout with placeholder ticker content — get the two-button asymmetry right first.
3. Wire the ChatGPT connect flow end to end against Moksha testnet.
4. Build `/result/[sessionId]` using the existing card renderer, updated per §1's corner radius and real logo mark — this is the first point real output appears, use it to sanity-check the whole visual system.
5. Build `/c/[cardId]` + OG image endpoint.
6. Register app identity for mainnet, resolve escrow funding — flag early, this is the one part of the Vana pipeline that isn't fully self-serve yet per the starter's own docs.
7. Ship ChatGPT-only to mainnet, list on the Vana Cup leaderboard, start scoring.
8. Build the Claude connector (parser, schema registration, upload UI, write-then-read flow) in parallel with step 7 once ChatGPT is live and scoring.
9. Add the Claude button to the already-live app as a fast-follow.
10. Wire the live ticker to real data once there's volume.

---

## 11. Self-critique checklist before calling anything done

- Does any screen resemble the three generic AI-design patterns in §7? Revise before proceeding.
- Is there a single fixed site-wide accent color anywhere, contradicting the rotating-accent system? Fix it.
- Do the two connect buttons look like visual peers? They should not.
- Any numbered-step UI (01/02/03) anywhere? Remove it.
- Does the card's corner radius, logo mark, and footer copy match the reference designs in §1 exactly?
- Is amber's text contrast checked explicitly, not just assumed safe?
- Does the page hold up with `prefers-reduced-motion` enabled and at mobile width?
