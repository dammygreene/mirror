const requestState = new Map<string, { createdAt: number; source: "chatgpt" | "claude"; sessionId: string }>();

export function createMockRequest(source: "chatgpt" | "claude") {
  const requestId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  requestState.set(requestId, { createdAt: Date.now(), source, sessionId });
  return { requestId, sessionId };
}

export function getMockStatus(requestId: string) {
  const state = requestState.get(requestId);
  if (!state) return null;
  const approved = Date.now() - state.createdAt > 1500;
  return { status: approved ? "approved" : "pending", ...state } as const;
}
