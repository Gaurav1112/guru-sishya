import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";

// fake-indexeddb/auto is loaded in vitest.setup.ts

beforeEach(async () => {
  // Clear all tables before each test
  await db.topics.clear();
  await db.flashcards.clear();
  await db.coinTransactions.clear();
});

describe("GuruSishyaDB – topics", () => {
  it("adds and retrieves a topic", async () => {
    const id = await db.topics.add({
      name: "React Hooks",
      category: "Frontend",
      createdAt: new Date(),
    });

    const topic = await db.topics.get(id);
    expect(topic).toBeDefined();
    expect(topic!.name).toBe("React Hooks");
    expect(topic!.category).toBe("Frontend");
  });

  it("queries topics by category", async () => {
    await db.topics.bulkAdd([
      { name: "TypeScript", category: "Language", createdAt: new Date() },
      { name: "React", category: "Frontend", createdAt: new Date() },
      { name: "Vue", category: "Frontend", createdAt: new Date() },
    ]);

    const frontendTopics = await db.topics
      .where("category")
      .equals("Frontend")
      .toArray();

    expect(frontendTopics).toHaveLength(2);
    expect(frontendTopics.map((t) => t.name)).toEqual(
      expect.arrayContaining(["React", "Vue"])
    );
  });
});

describe("GuruSishyaDB – flashcards", () => {
  it("queries flashcards by nextReviewAt", async () => {
    const past = new Date(Date.now() - 86400000); // yesterday
    const future = new Date(Date.now() + 86400000); // tomorrow
    const now = new Date();

    await db.flashcards.bulkAdd([
      {
        topicId: 1,
        concept: "useState",
        front: "What does useState return?",
        back: "A state value and a setter function",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReviewAt: past,
      },
      {
        topicId: 1,
        concept: "useEffect",
        front: "When does useEffect run?",
        back: "After every render by default",
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
        nextReviewAt: future,
      },
    ]);

    // Cards due for review: nextReviewAt <= now
    const dueCards = await db.flashcards
      .where("nextReviewAt")
      .belowOrEqual(now)
      .toArray();

    expect(dueCards).toHaveLength(1);
    expect(dueCards[0].concept).toBe("useState");
  });

  it("retrieves all flashcards for a topic", async () => {
    await db.flashcards.bulkAdd([
      {
        topicId: 2,
        concept: "A",
        front: "Q1",
        back: "A1",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewAt: new Date(),
      },
      {
        topicId: 2,
        concept: "B",
        front: "Q2",
        back: "A2",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewAt: new Date(),
      },
      {
        topicId: 3,
        concept: "C",
        front: "Q3",
        back: "A3",
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewAt: new Date(),
      },
    ]);

    const topic2Cards = await db.flashcards
      .where("topicId")
      .equals(2)
      .toArray();

    expect(topic2Cards).toHaveLength(2);
  });
});

describe("GuruSishyaDB – coinTransactions", () => {
  it("tracks earn transactions", async () => {
    await db.coinTransactions.add({
      type: "earn",
      amount: 50,
      reason: "Completed quiz",
      createdAt: new Date(),
    });

    const all = await db.coinTransactions.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe("earn");
    expect(all[0].amount).toBe(50);
  });

  it("tracks spend transactions and calculates balance", async () => {
    await db.coinTransactions.bulkAdd([
      { type: "earn", amount: 100, reason: "Quiz bonus", createdAt: new Date() },
      { type: "earn", amount: 50, reason: "Streak reward", createdAt: new Date() },
      { type: "spend", amount: 30, reason: "Bought item", createdAt: new Date() },
    ]);

    const all = await db.coinTransactions.toArray();
    const balance = all.reduce((acc, tx) => {
      return tx.type === "earn" ? acc + tx.amount : acc - tx.amount;
    }, 0);

    expect(balance).toBe(120);
  });

  it("queries only earn transactions", async () => {
    await db.coinTransactions.bulkAdd([
      { type: "earn", amount: 100, reason: "r1", createdAt: new Date() },
      { type: "spend", amount: 20, reason: "r2", createdAt: new Date() },
      { type: "earn", amount: 40, reason: "r3", createdAt: new Date() },
    ]);

    const earns = await db.coinTransactions
      .where("type")
      .equals("earn")
      .toArray();

    expect(earns).toHaveLength(2);
  });
});
