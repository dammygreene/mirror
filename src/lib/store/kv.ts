import { Redis } from "@upstash/redis";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MirrorCardSource } from "@/lib/vana/constants";

type CardRecord = {
  cardId: string;
  sessionId: string;
  source: MirrorCardSource;
  createdAt: string;
  persona: unknown;
  svg: string;
  pngBase64: string;
};

type SessionRecord = {
  sessionId: string;
  source: MirrorCardSource;
  input: unknown;
  persona?: unknown;
  cardId?: string;
  referralCode?: string;
  createdAt: string;
};

export type Referrer = {
  handle: string;
  referralCode: string;
  referredCount: number;
  createdAt: string;
  sessionId: string;
  cardId: string;
};

export type ReferralEvent = {
  referralCode: string;
  newSessionId: string;
  createdAt: string;
};

export type CupStanding = {
  rank: number | null;
  goals: number;
  assists: number;
  points: number;
  updatedAt: string;
};

type LocalDb = {
  cards: Record<string, CardRecord>;
  sessions: Record<string, SessionRecord>;
  referrers: Record<string, Referrer>;
  handleIndex: Record<string, string>;
  referralEvents: Record<string, ReferralEvent>;
  standing: CupStanding;
};

const defaultStanding: CupStanding = {
  rank: null,
  goals: 0,
  assists: 0,
  points: 0,
  updatedAt: "not updated yet",
};

const dbPath = path.join(process.cwd(), ".mirror-store", "db.json");

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (!url.startsWith("https://")) {
    console.warn("Ignoring invalid KV_REST_API_URL. Expected an Upstash REST URL starting with https://.");
    return null;
  }
  return new Redis({ url, token });
}

const redis = getRedis();

async function readLocal() {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    return {
      cards: parsed.cards ?? {},
      sessions: parsed.sessions ?? {},
      referrers: parsed.referrers ?? {},
      handleIndex: parsed.handleIndex ?? {},
      referralEvents: parsed.referralEvents ?? {},
      standing: parsed.standing ?? defaultStanding,
    } satisfies LocalDb;
  } catch {
    return { cards: {}, sessions: {}, referrers: {}, handleIndex: {}, referralEvents: {}, standing: defaultStanding };
  }
}

async function writeLocal(data: LocalDb) {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(data), "utf8");
}

function normalizeHandle(handle: string) {
  return handle.trim().toLowerCase();
}

function makeReferralCode(handle: string) {
  const base = normalizeHandle(handle)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
  return `${base || "mirror"}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function storeSession(session: SessionRecord) {
  if (redis) {
    await redis.hset(`session:${session.sessionId}`, session as Record<string, unknown>);
    return;
  }
  const local = await readLocal();
  local.sessions[session.sessionId] = session;
  await writeLocal(local);
}

export async function getSession(sessionId: string): Promise<SessionRecord | null> {
  if (redis) {
    const value = await redis.hgetall<SessionRecord>(`session:${sessionId}`);
    return value?.sessionId ? value : null;
  }
  const local = await readLocal();
  return local.sessions[sessionId] ?? null;
}

export async function storeCard(card: CardRecord) {
  if (redis) {
    await redis.hset(`card:${card.cardId}`, card as Record<string, unknown>);
    await redis.lpush("card:recent", card.cardId);
    await redis.ltrim("card:recent", 0, 29);
    return;
  }
  const local = await readLocal();
  local.cards[card.cardId] = card;
  await writeLocal(local);
}

export async function getCard(cardId: string): Promise<CardRecord | null> {
  if (redis) {
    const value = await redis.hgetall<CardRecord>(`card:${cardId}`);
    return value?.cardId ? value : null;
  }
  const local = await readLocal();
  return local.cards[cardId] ?? null;
}

export async function listRecentCards(limit = 10): Promise<CardRecord[]> {
  if (redis) {
    const ids = await redis.lrange<string>("card:recent", 0, limit - 1);
    const values = await Promise.all(ids.map((id) => getCard(id)));
    return values.filter((v): v is CardRecord => Boolean(v));
  }
  const local = await readLocal();
  return Object.values(local.cards)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getCardBySession(sessionId: string): Promise<CardRecord | null> {
  if (redis) {
    const recent = await listRecentCards(50);
    return recent.find((card) => card.sessionId === sessionId) ?? null;
  }
  const local = await readLocal();
  return Object.values(local.cards).find((card) => card.sessionId === sessionId) ?? null;
}

export async function createReferrer({
  handle,
  sessionId,
  cardId,
}: {
  handle: string;
  sessionId: string;
  cardId: string;
}): Promise<{ ok: true; referrer: Referrer } | { ok: false; error: string }> {
  const normalized = normalizeHandle(handle);
  if (!/^[a-z0-9_]{3,18}$/.test(normalized)) {
    return { ok: false, error: "use 3-18 letters, numbers, or underscores" };
  }
  if (/\b(admin|mirror|vana|fuck|shit|bitch|asshole|cunt|nigger|faggot)\b/i.test(normalized)) {
    return { ok: false, error: "pick a different handle" };
  }

  const session = await getSession(sessionId);
  if (!session?.cardId || session.cardId !== cardId) return { ok: false, error: "card session not found" };
  if (session.referralCode) {
    const existing = await getReferrer(session.referralCode);
    if (existing) return { ok: true, referrer: existing };
  }

  const createdAt = new Date().toISOString();
  if (redis) {
    const existingCode = await redis.get<string>(`referral:handle:${normalized}`);
    if (existingCode) return { ok: false, error: "that handle is taken" };
    const referralCode = makeReferralCode(normalized);
    const referrer: Referrer = { handle: normalized, referralCode, referredCount: 0, createdAt, sessionId, cardId };
    await redis.hset(`referrer:${referralCode}`, referrer as unknown as Record<string, unknown>);
    await redis.set(`referral:handle:${normalized}`, referralCode);
    await redis.sadd("referrers", referralCode);
    await storeSession({ ...session, referralCode });
    return { ok: true, referrer };
  }

  const local = await readLocal();
  if (local.handleIndex[normalized]) return { ok: false, error: "that handle is taken" };
  const referralCode = makeReferralCode(normalized);
  const referrer: Referrer = { handle: normalized, referralCode, referredCount: 0, createdAt, sessionId, cardId };
  local.referrers[referralCode] = referrer;
  local.handleIndex[normalized] = referralCode;
  local.sessions[sessionId] = { ...session, referralCode };
  await writeLocal(local);
  return { ok: true, referrer };
}

export async function getReferrer(referralCode: string): Promise<Referrer | null> {
  if (redis) {
    const value = await redis.hgetall<Referrer>(`referrer:${referralCode}`);
    return value?.referralCode ? value : null;
  }
  const local = await readLocal();
  return local.referrers[referralCode] ?? null;
}

export async function getReferrerBySession(sessionId: string): Promise<Referrer | null> {
  const session = await getSession(sessionId);
  if (session?.referralCode) return getReferrer(session.referralCode);
  return null;
}

export async function creditReferral(referralCode: string, newSessionId: string) {
  const referrer = await getReferrer(referralCode);
  if (!referrer) return { credited: false, reason: "invalid" as const };
  const session = await getSession(newSessionId);
  if (session?.referralCode === referralCode) return { credited: false, reason: "self" as const };

  if (redis) {
    const eventKey = `referral:event:${newSessionId}`;
    const existing = await redis.get<ReferralEvent>(eventKey);
    if (existing) return { credited: false, reason: "duplicate" as const };
    const createdAt = new Date().toISOString();
    await redis.set(eventKey, { referralCode, newSessionId, createdAt } satisfies ReferralEvent);
    await redis.hincrby(`referrer:${referralCode}`, "referredCount", 1);
    return { credited: true, reason: "credited" as const };
  }

  const local = await readLocal();
  if (local.referralEvents[newSessionId]) return { credited: false, reason: "duplicate" as const };
  local.referralEvents[newSessionId] = { referralCode, newSessionId, createdAt: new Date().toISOString() };
  local.referrers[referralCode] = { ...local.referrers[referralCode], referredCount: local.referrers[referralCode].referredCount + 1 };
  await writeLocal(local);
  return { credited: true, reason: "credited" as const };
}

export async function listReferrers(limit = 100): Promise<Referrer[]> {
  if (redis) {
    const codes = await redis.smembers<string[]>("referrers");
    const values = await Promise.all((codes ?? []).map((code) => getReferrer(code)));
    return values
      .filter((value): value is Referrer => Boolean(value))
      .sort((a, b) => b.referredCount - a.referredCount || a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit);
  }
  const local = await readLocal();
  return Object.values(local.referrers)
    .sort((a, b) => b.referredCount - a.referredCount || a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

export async function getCupStanding(): Promise<CupStanding> {
  if (redis) {
    const value = await redis.hgetall<CupStanding>("cup:standing");
    return value?.updatedAt ? value : defaultStanding;
  }
  const local = await readLocal();
  return local.standing;
}

export async function updateCupStanding(standing: CupStanding) {
  if (redis) {
    await redis.hset("cup:standing", standing as unknown as Record<string, unknown>);
    return standing;
  }
  const local = await readLocal();
  local.standing = standing;
  await writeLocal(local);
  return standing;
}
