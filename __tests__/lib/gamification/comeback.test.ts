import { describe, it, expect } from "vitest";
import {
  checkComeback,
  startComebackProgress,
  recordComebackSession,
  isComebackComplete,
  isComebackExpired,
  getComebackMessage,
} from "@/lib/gamification/comeback";

// ── checkComeback ─────────────────────────────────────────────────────────────

describe("checkComeback", () => {
  it("returns eligible:false when lastActivityDate is empty", () => {
    const result = checkComeback("", "2025-03-21");
    expect(result.eligible).toBe(false);
    expect(result.daysAway).toBe(0);
  });

  it("returns eligible:false when gap < 3 days", () => {
    expect(checkComeback("2025-03-20", "2025-03-21").eligible).toBe(false); // 1 day
    expect(checkComeback("2025-03-19", "2025-03-21").eligible).toBe(false); // 2 days
  });

  it("returns eligible:true at exactly 3 days away", () => {
    const result = checkComeback("2025-03-18", "2025-03-21");
    expect(result.eligible).toBe(true);
    expect(result.daysAway).toBe(3);
  });

  it("returns correct daysAway for large gaps", () => {
    const result = checkComeback("2025-02-01", "2025-03-21");
    expect(result.eligible).toBe(true);
    expect(result.daysAway).toBe(48);
  });
});

// ── startComebackProgress ─────────────────────────────────────────────────────

describe("startComebackProgress", () => {
  it("starts with 0 sessions", () => {
    const progress = startComebackProgress("2025-03-21");
    expect(progress.sessionsCompleted).toBe(0);
  });

  it("sets startedAt to today", () => {
    const progress = startComebackProgress("2025-03-21");
    expect(progress.startedAt).toBe("2025-03-21");
  });

  it("sets deadline 3 days later", () => {
    const progress = startComebackProgress("2025-03-21");
    expect(progress.deadline).toBe("2025-03-24");
  });
});

// ── recordComebackSession ─────────────────────────────────────────────────────

describe("recordComebackSession", () => {
  it("increments sessionsCompleted", () => {
    let progress = startComebackProgress("2025-03-21");
    progress = recordComebackSession(progress);
    expect(progress.sessionsCompleted).toBe(1);
    progress = recordComebackSession(progress);
    expect(progress.sessionsCompleted).toBe(2);
  });

  it("does not mutate original", () => {
    const original = startComebackProgress("2025-03-21");
    recordComebackSession(original);
    expect(original.sessionsCompleted).toBe(0);
  });
});

// ── isComebackComplete ────────────────────────────────────────────────────────

describe("isComebackComplete", () => {
  it("is false at 0, 1, 2 sessions", () => {
    let p = startComebackProgress("2025-03-21");
    expect(isComebackComplete(p)).toBe(false);
    p = recordComebackSession(p);
    expect(isComebackComplete(p)).toBe(false);
    p = recordComebackSession(p);
    expect(isComebackComplete(p)).toBe(false);
  });

  it("is true at 3 sessions", () => {
    let p = startComebackProgress("2025-03-21");
    p = recordComebackSession(p);
    p = recordComebackSession(p);
    p = recordComebackSession(p);
    expect(isComebackComplete(p)).toBe(true);
  });
});

// ── isComebackExpired ─────────────────────────────────────────────────────────

describe("isComebackExpired", () => {
  it("is false before the deadline", () => {
    const p = startComebackProgress("2025-03-21");
    expect(isComebackExpired(p, "2025-03-22")).toBe(false);
  });

  it("is true after the deadline when incomplete", () => {
    const p = startComebackProgress("2025-03-21");
    expect(isComebackExpired(p, "2025-03-25")).toBe(true);
  });

  it("is false when complete even after deadline", () => {
    let p = startComebackProgress("2025-03-21");
    p = recordComebackSession(p);
    p = recordComebackSession(p);
    p = recordComebackSession(p);
    expect(isComebackExpired(p, "2025-03-30")).toBe(false);
  });
});

// ── getComebackMessage ────────────────────────────────────────────────────────

describe("getComebackMessage", () => {
  it("returns a string for all day ranges", () => {
    for (const days of [3, 5, 7, 10, 14, 20, 30, 60]) {
      const msg = getComebackMessage(days);
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("mentions days away in message for small gaps", () => {
    const msg = getComebackMessage(4);
    expect(msg).toContain("4");
  });
});
