import type { MirrorSource, NormalizedConversation, NormalizedMessage, NormalizedPayload } from "./constants";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function textFromParts(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        const record = asRecord(part);
        return typeof record?.text === "string" ? record.text : "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return "";
}

function normalizeRole(value: unknown): NormalizedMessage["role"] {
  return value === "assistant" || value === "claude" ? "assistant" : "user";
}

function normalizeMessage(value: unknown): NormalizedMessage | null {
  const message = asRecord(value);
  if (!message) return null;

  const author = asRecord(message.author);
  const content = asRecord(message.content);
  const text =
    textFromParts(message.text) ||
    textFromParts(message.content) ||
    textFromParts(content?.parts) ||
    textFromParts(content?.text);

  if (!text) return null;

  return {
    role: normalizeRole(message.role ?? message.sender ?? author?.role),
    text,
    timestamp:
      typeof message.timestamp === "string"
        ? message.timestamp
        : typeof message.created_at === "string"
          ? message.created_at
          : undefined,
  };
}

function normalizeConversation(value: unknown, index: number, source: MirrorSource): NormalizedConversation | null {
  const conversation = asRecord(value);
  if (!conversation) return null;

  const mapping = asRecord(conversation.mapping);
  const rawMessages = Array.isArray(conversation.messages)
    ? conversation.messages
    : Array.isArray(conversation.chat_messages)
      ? conversation.chat_messages
      : mapping
        ? Object.values(mapping)
            .map((node) => asRecord(node)?.message)
            .filter(Boolean)
        : [];

  const messages = rawMessages
    .map(normalizeMessage)
    .filter((message): message is NormalizedMessage => Boolean(message));

  if (!messages.length) return null;

  return {
    id:
      typeof conversation.id === "string"
        ? conversation.id
        : typeof conversation.uuid === "string"
          ? conversation.uuid
          : `${source}-${index}`,
    title:
      typeof conversation.title === "string"
        ? conversation.title
        : typeof conversation.name === "string"
          ? conversation.name
          : undefined,
    messages,
  };
}

function getRawConversations(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (!record) return [];
  if (Array.isArray(record.conversations)) return record.conversations;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.data)) return record.data;
  return [];
}

export function normalizeVanaData(source: MirrorSource, data: unknown): NormalizedPayload {
  const conversations = getRawConversations(data)
    .map((conversation, index) => normalizeConversation(conversation, index, source))
    .filter((conversation): conversation is NormalizedConversation => Boolean(conversation));

  return { source, conversations };
}
