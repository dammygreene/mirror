import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCupStanding } from "@/lib/store/kv";

const bodySchema = z.object({
  rank: z.number().int().positive().nullable(),
  goals: z.number().int().nonnegative(),
  assists: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  updatedAt: z.string().optional(),
});

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.MIRROR_ADMIN_TOKEN || token !== process.env.MIRROR_ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const standing = { ...parsed.data, updatedAt: parsed.data.updatedAt ?? new Date().toISOString() };
  await updateCupStanding(standing);
  return NextResponse.json({ standing });
}
