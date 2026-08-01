import { NextResponse } from "next/server";
import { parseClaudeExport } from "@/lib/claude-export/parse";
import { validateClaudeExportShape, validateUploadSize } from "@/lib/claude-export/validate";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  validateUploadSize(file.size);
  const text = await file.text();
  const payload = JSON.parse(text);
  const conversations = parseClaudeExport(validateClaudeExportShape(payload));

  return NextResponse.json({ conversations, count: conversations.length });
}
