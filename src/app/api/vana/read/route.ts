import { NextResponse } from "next/server";
import { z } from "zod";
import { getVanaController } from "@/lib/vana/controller";
import { normalizeVanaData } from "@/lib/vana/normalize";

const querySchema = z.object({
  source: z.enum(["spotify", "youtube"]).default("spotify"),
  requestId: z.string().min(1),
});

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  try {
    const result = await getVanaController(parsed.data.source).readApprovedData({ requestId: parsed.data.requestId });
    const payload = normalizeVanaData(parsed.data.source, result.data);
    const count = payload.spotify?.savedTracks.length ?? payload.youtube?.history.length ?? 0;
    if (!count) {
      return NextResponse.json({ error: `No ${parsed.data.source} data was returned from Vana.` }, { status: 502 });
    }

    return NextResponse.json({ ...payload, scope: result.scope, payment: result.payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vana read failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
