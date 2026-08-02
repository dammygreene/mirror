import { NextResponse } from "next/server";
import { z } from "zod";
import { getVanaController } from "@/lib/vana/controller";
import { mirrorSourceSchema } from "@/lib/vana/schemas";

const querySchema = z.object({
  requestId: z.string().min(1),
  source: mirrorSourceSchema.default("spotify"),
});

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "requestId required" }, { status: 400 });

  try {
    const status = await getVanaController(parsed.data.source).getAccessRequestStatus(parsed.data.requestId);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check Vana request status";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
