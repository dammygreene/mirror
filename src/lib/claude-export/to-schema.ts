import type { NormalizedConversation } from "@/lib/vana/constants";

export function toClaudeSchema(conversations: NormalizedConversation[]) {
  return {
    source: "claude",
    collectedAt: new Date().toISOString(),
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title ?? "Untitled",
      createdAt: conversation.messages[0]?.timestamp ?? new Date().toISOString(),
      messages: conversation.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "human",
        text: m.text,
        timestamp: m.timestamp,
      })),
    })),
  };
}
