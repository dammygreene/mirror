import { NextResponse } from "next/server";
import { getMockStatus } from "@/lib/vana/mock-state";

export async function GET(req: Request) {
  const requestId = new URL(req.url).searchParams.get("requestId");
  if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

  const status = getMockStatus(requestId);
  if (!status) return NextResponse.json({ error: "request not found" }, { status: 404 });
  return NextResponse.json(status);
}
