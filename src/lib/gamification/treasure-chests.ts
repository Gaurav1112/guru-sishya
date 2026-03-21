// ────────────────────────────────────────────────────────────────────────────
// Treasure Chests — random drops after completed rounds
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";

export interface ChestReward {
  coins: number;
  item?: {
    type: "cosmetic" | "potion";
    id: string;
    name: string;
  };
}

// ── Cosmetic / potion item pools ──────────────────────────────────────────────

const COSMETIC_ITEMS = [
  { id: "flame_purple", name: "Purple Flame" },
  { id: "aura_gold", name: "Golden Aura" },
  { id: "border_ancient", name: "Ancient Border" },
  { id: "badge_lotus", name: "Lotus Badge" },
  { id: "avatar_guru", name: "Guru Avatar Frame" },
  { id: "theme_midnight", name: "Midnight Theme" },
];

const POTION_ITEMS = [
  { id: "xp_boost_1h", name: "XP Boost (1 hour)" },
  { id: "streak_freeze", name: "Streak Freeze" },
  { id: "hint_token", name: "Hint Token" },
  { id: "difficulty_shield", name: "Difficulty Shield" },
];

// ── Drop logic ────────────────────────────────────────────────────────────────

/**
 * Returns true if a treasure chest should drop after a completed round.
 *
 * A chest drops if the gap since the last chest is in the [3, 7] range
 * AND a random roll passes (probability rises with the gap, capped at 100%
 * once 7+ rounds have passed with no chest).
 *
 * @param roundsCompleted  Total rounds completed so far (including this one)
 * @param lastChestAt      roundsCompleted count at which the last chest dropped
 */
export function shouldDropChest(
  roundsCompleted: number,
  lastChestAt: number
): boolean {
  const gap = roundsCompleted - lastChestAt;

  if (gap < 3) return false;
  if (gap >= 7) return true;

  // Linear ramp: 3 rounds → 20%, 4 → 40%, 5 → 60%, 6 → 80%
  const probability = (gap - 2) * 0.2;
  return Math.random() < probability;
}

// ── Contents ──────────────────────────────────────────────────────────────────

/**
 * Randomly generates the contents of a treasure chest.
 * Always contains coins (20-100); occasionally contains an item (30% chance).
 */
export function generateChestContents(): ChestReward {
  const coins = Math.floor(Math.random() * 81) + 20; // 20-100
  const hasItem = Math.random() < 0.3;

  if (!hasItem) return { coins };

  const isPotion = Math.random() < 0.4; // 40% potion, 60% cosmetic
  const pool = isPotion ? POTION_ITEMS : COSMETIC_ITEMS;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    coins,
    item: {
      type: isPotion ? "potion" : "cosmetic",
      id: picked.id,
      name: picked.name,
    },
  };
}

// ── Dexie integration ─────────────────────────────────────────────────────────

/**
 * Records a newly earned (unopened) chest in Dexie.
 * Returns the chest's database id.
 */
export async function recordChest(): Promise<number> {
  return db.treasureChests.add({ earnedAt: new Date(), opened: false }) as Promise<number>;
}

/**
 * Opens a chest: marks it as opened in Dexie, generates and returns its reward.
 * If the chest id doesn't exist or is already opened, returns null.
 */
export async function openChest(chestId: number): Promise<ChestReward | null> {
  const chest = await db.treasureChests.get(chestId);
  if (!chest || chest.opened) return null;

  await db.treasureChests.update(chestId, { opened: true });

  const reward = generateChestContents();

  // Persist the item to inventory if present
  if (reward.item) {
    await db.inventory
      .add({
        itemType: reward.item.type,
        itemId: reward.item.id,
        acquiredAt: new Date(),
        equipped: false,
      })
      .catch(() => {});
  }

  return reward;
}

/**
 * Returns all unopened chests from Dexie.
 */
export async function getUnopenedChests() {
  return db.treasureChests.where("opened").equals(0).toArray();
}
