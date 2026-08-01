import type { NormalizedConversation, NormalizedMessage } from "@/lib/vana/constants";
import type { RawClaudeConversation, RawClaudeMessage } from "./validate";

function messageText(message: RawClaudeMessage) {
  return (message.text ?? message.content ?? "").trim();
}

function flattenMessages(messages: RawClaudeMessage[]): NormalizedMessage[] {
  const byId = new Map<string, RawClaudeMessage>();
  for (const m of messages) {
    if (m.uuid) byId.set(m.uuid, m);
  }

  const children = new Map<string, RawClaudeMessage[]>();
  const roots: RawClaudeMessage[] = [];

  for (const m of messages) {
    if (!m.parent_message_uuid || !byId.has(m.parent_message_uuid)) {
      roots.push(m);
      continue;
    }
    const arr = children.get(m.parent_message_uuid) ?? [];
    arr.push(m);
    children.set(m.parent_message_uuid, arr);
  }

  const ordered: RawClaudeMessage[] = [];
  const stack = [...roots].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
  while (stack.length) {
    const current = stack.shift()!;
    ordered.push(current);
    const next = (children.get(current.uuid ?? "") ?? []).sort((a, b) =>
      (a.created_at ?? "").localeCompare(b.created_at ?? ""),
    );
    stack.unshift(...next);
  }

  return ordered
    .map((m) => ({
      role: m.sender === "assistant" ? ("assistant" as const) : ("user" as const),
      text: messageText(m),
      timestamp: m.created_at,
    }))
    .filter((m) => m.text.length > 0);
}

export function parseClaudeExport(conversations: RawClaudeConversation[]): NormalizedConversation[] {
  return conversations
    .map((conversation, index) => {
      const parsed = flattenMessages(conversation.chat_messages ?? []);
      return {
        id: conversation.uuid ?? `claude-${index}`,
        title: conversation.name,
        messages: parsed,
      };
    })
    .filter((c) => c.messages.length > 0);
}
