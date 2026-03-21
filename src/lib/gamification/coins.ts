import { db } from "@/lib/db";
import type { CoinTransaction } from "@/lib/types";

/**
 * Returns the current coin balance by summing all earn/spend transactions.
 * Note: the Zustand store's `coins` field is the canonical in-memory value;
 * this function provides a Dexie-backed authoritative balance useful for
 * cross-session verification and the profile page.
 */
export async function getCoinBalance(): Promise<number> {
  const transactions = await db.coinTransactions.toArray();
  return transactions.reduce((acc, tx) => {
    return tx.type === "earn" ? acc + tx.amount : acc - tx.amount;
  }, 0);
}

/**
 * Returns the last N coin transactions sorted by createdAt descending.
 */
export async function getRecentTransactions(limit: number): Promise<CoinTransaction[]> {
  return db.coinTransactions
    .orderBy("createdAt")
    .reverse()
    .limit(limit)
    .toArray();
}
