export type RawClaudeMessage = {
  uuid?: string;
  parent_message_uuid?: string | null;
  text?: string;
  content?: string;
  sender?: "human" | "assistant";
  created_at?: string;
};

export type RawClaudeConversation = {
  uuid?: string;
  name?: string;
  created_at?: string;
  chat_messages?: RawClaudeMessage[];
};

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function validateUploadSize(size: number) {
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error("File too large. Please upload conversations.json under 15MB.");
  }
}

export function validateClaudeExportShape(payload: unknown): RawClaudeConversation[] {
  if (!Array.isArray(payload)) throw new Error("Claude export must be an array of conversations.");
  return payload as RawClaudeConversation[];
}
