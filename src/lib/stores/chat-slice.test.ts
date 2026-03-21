import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createChatSlice, type ChatSlice } from "./chat-slice";

// Build a minimal test store using only the chat slice
function makeStore() {
  return create<ChatSlice>()(
    immer((...args) => ({
      ...createChatSlice(...args),
    }))
  );
}

describe("createChatSlice", () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
  });

  it("initialises with null feynmanChat", () => {
    expect(store.getState().feynmanChat).toBeNull();
  });

  it("startFeynmanChat creates state with correct values", () => {
    store.getState().startFeynmanChat(1, "Programming", "recursion");
    const chat = store.getState().feynmanChat;
    expect(chat).not.toBeNull();
    expect(chat?.topicId).toBe(1);
    expect(chat?.topicName).toBe("Programming");
    expect(chat?.concept).toBe("recursion");
    expect(chat?.phase).toBe(1);
    expect(chat?.round).toBe(1);
    expect(chat?.status).toBe("priming");
    expect(chat?.mastered).toBe(false);
    expect(chat?.messages).toHaveLength(0);
  });

  it("addChatMessage adds messages in order", () => {
    store.getState().startFeynmanChat(1, "Math", "derivatives");
    store.getState().addChatMessage("assistant", "Hello student!");
    store.getState().addChatMessage("user", "I know calculus basics");
    const msgs = store.getState().feynmanChat?.messages;
    expect(msgs).toHaveLength(2);
    expect(msgs?.[0].role).toBe("assistant");
    expect(msgs?.[0].content).toBe("Hello student!");
    expect(msgs?.[1].role).toBe("user");
    expect(msgs?.[1].content).toBe("I know calculus basics");
  });

  it("setFeynmanPhase updates phase", () => {
    store.getState().startFeynmanChat(1, "Math", "derivatives");
    store.getState().setFeynmanPhase(3);
    expect(store.getState().feynmanChat?.phase).toBe(3);
  });

  it("setFeynmanStatus updates status", () => {
    store.getState().startFeynmanChat(1, "Math", "derivatives");
    store.getState().setFeynmanStatus("recalling");
    expect(store.getState().feynmanChat?.status).toBe("recalling");
  });

  it("setFeynmanRound updates round", () => {
    store.getState().startFeynmanChat(1, "Math", "derivatives");
    store.getState().setFeynmanRound(3);
    expect(store.getState().feynmanChat?.round).toBe(3);
  });

  it("updateMasteryScores updates individual scores", () => {
    store.getState().startFeynmanChat(1, "Math", "derivatives");
    store.getState().updateMasteryScores({ completeness: 75, accuracy: 7 });
    const scores = store.getState().feynmanChat?.masteryScores;
    expect(scores?.completeness).toBe(75);
    expect(scores?.accuracy).toBe(7);
    // Untouched
    expect(scores?.depth).toBe(0);
    expect(scores?.originality).toBe(0);
  });

  it("endFeynmanChat sets mastered and status to complete", () => {
    store.getState().startFeynmanChat(1, "Math", "derivatives");
    store.getState().endFeynmanChat(true);
    const chat = store.getState().feynmanChat;
    expect(chat?.mastered).toBe(true);
    expect(chat?.status).toBe("complete");
  });

  it("endFeynmanChat with false sets mastered false and complete", () => {
    store.getState().startFeynmanChat(1, "Math", "derivatives");
    store.getState().endFeynmanChat(false);
    const chat = store.getState().feynmanChat;
    expect(chat?.mastered).toBe(false);
    expect(chat?.status).toBe("complete");
  });

  it("slice methods are no-ops when feynmanChat is null", () => {
    // Should not throw
    expect(() => store.getState().setFeynmanPhase(3)).not.toThrow();
    expect(() => store.getState().setFeynmanStatus("recalling")).not.toThrow();
    expect(() => store.getState().setFeynmanRound(2)).not.toThrow();
    expect(() => store.getState().updateMasteryScores({ completeness: 50 })).not.toThrow();
    expect(() => store.getState().addChatMessage("user", "hello")).not.toThrow();
    expect(() => store.getState().endFeynmanChat(true)).not.toThrow();
    // Still null after all ops
    expect(store.getState().feynmanChat).toBeNull();
  });

  it("masteryScores default to zero", () => {
    store.getState().startFeynmanChat(1, "Science", "DNA");
    const scores = store.getState().feynmanChat?.masteryScores;
    expect(scores?.completeness).toBe(0);
    expect(scores?.accuracy).toBe(0);
    expect(scores?.depth).toBe(0);
    expect(scores?.originality).toBe(0);
  });
});
