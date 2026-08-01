export const SOURCES = {
  chatgpt: "chatgpt.conversations",
  claude: "claude.conversations",
} as const;

export type MirrorSource = keyof typeof SOURCES;

export type NormalizedMessage = {
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
};

export type NormalizedConversation = {
  id: string;
  title?: string;
  messages: NormalizedMessage[];
};

export type NormalizedPayload = {
  source: MirrorSource;
  conversations: NormalizedConversation[];
};
