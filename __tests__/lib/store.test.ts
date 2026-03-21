import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "@/lib/store";

// ────────────────────────────────────────────────────────────────────────────
// Reset store state before each test
// ────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useStore.setState({
    apiKey: "",
    theme: "dark",
    soundEnabled: false,
    dailyGoal: 15,
    timezone: "UTC",
    totalXP: 0,
    level: 1,
    coins: 0,
    currentStreak: 0,
    longestStreak: 0,
    streakFreezes: 0,
    celebrationQueue: [],
    sidebarOpen: true,
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Settings slice
// ────────────────────────────────────────────────────────────────────────────

describe("Settings slice", () => {
  it("stores and retrieves API key", () => {
    useStore.getState().setApiKey("sk-ant-test-key");
    expect(useStore.getState().apiKey).toBe("sk-ant-test-key");
  });

  it("toggles sound", () => {
    expect(useStore.getState().soundEnabled).toBe(false);
    useStore.getState().setSoundEnabled(true);
    expect(useStore.getState().soundEnabled).toBe(true);
  });

  it("changes theme", () => {
    useStore.getState().setTheme("light");
    expect(useStore.getState().theme).toBe("light");
  });

  it("updates daily goal", () => {
    useStore.getState().setDailyGoal(30);
    expect(useStore.getState().dailyGoal).toBe(30);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Game slice
// ────────────────────────────────────────────────────────────────────────────

describe("Game slice – XP and levels", () => {
  it("starts at level 1 with 0 XP", () => {
    const { totalXP, level } = useStore.getState();
    expect(totalXP).toBe(0);
    expect(level).toBe(1);
  });

  it("adds XP and stays at level 1 below threshold", () => {
    useStore.getState().addXP(50);
    const { totalXP, level } = useStore.getState();
    expect(totalXP).toBe(50);
    expect(level).toBe(1); // level 1 needs 100 XP
  });

  it("adds XP and levels up when crossing threshold", () => {
    useStore.getState().addXP(100); // completes level 1 (needs 100 XP)
    const { totalXP, level } = useStore.getState();
    expect(totalXP).toBe(100);
    expect(level).toBe(2); // now at level 2
  });

  it("levels up multiple times from large XP gain", () => {
    useStore.getState().addXP(500);
    const { level } = useStore.getState();
    expect(level).toBeGreaterThan(2);
  });
});

describe("Game slice – coins", () => {
  it("adds coins", () => {
    useStore.getState().addCoins(50, "Test reward");
    expect(useStore.getState().coins).toBe(50);
  });

  it("spends coins when balance is sufficient", () => {
    useStore.getState().addCoins(100, "Initial");
    const result = useStore.getState().spendCoins(30, "Purchase");
    expect(result).toBe(true);
    expect(useStore.getState().coins).toBe(70);
  });

  it("returns false and does not deduct when insufficient funds", () => {
    useStore.getState().addCoins(20, "Initial");
    const result = useStore.getState().spendCoins(50, "Too expensive");
    expect(result).toBe(false);
    expect(useStore.getState().coins).toBe(20);
  });

  it("allows spending exactly the full balance", () => {
    useStore.getState().addCoins(100, "Initial");
    const result = useStore.getState().spendCoins(100, "All in");
    expect(result).toBe(true);
    expect(useStore.getState().coins).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// UI slice – celebration queue
// ────────────────────────────────────────────────────────────────────────────

describe("UI slice – celebration queue", () => {
  it("starts with an empty queue", () => {
    expect(useStore.getState().celebrationQueue).toHaveLength(0);
  });

  it("queues a celebration", () => {
    useStore.getState().queueCelebration({ type: "xp_gain", data: { amount: 50 } });
    expect(useStore.getState().celebrationQueue).toHaveLength(1);
    expect(useStore.getState().celebrationQueue[0].type).toBe("xp_gain");
  });

  it("dequeues a celebration in FIFO order", () => {
    useStore.getState().queueCelebration({ type: "xp_gain", data: {} });
    useStore.getState().queueCelebration({ type: "level_up", data: { level: 2 } });
    useStore.getState().dequeueCelebration();

    const queue = useStore.getState().celebrationQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("level_up");
  });

  it("does not throw when dequeueing from empty queue", () => {
    expect(() => useStore.getState().dequeueCelebration()).not.toThrow();
  });

  it("sets sidebar open state", () => {
    useStore.getState().setSidebarOpen(false);
    expect(useStore.getState().sidebarOpen).toBe(false);
  });
});
