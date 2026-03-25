"use client";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import { toast } from "sonner";

// ────────────────────────────────────────────────────────────────────────────
// Shop item definitions
// ────────────────────────────────────────────────────────────────────────────

interface ShopItem {
  id: string;
  name: string;
  description: string;
  effectDetail: string;
  cost: number;
  icon: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "streak_freeze",
    name: "Streak Freeze",
    description: "Protect your streak for one missed day",
    effectDetail: "Auto-applied when you miss a day. One freeze = one day of protection.",
    cost: 75,
    icon: "🧊",
  },
  {
    id: "quiz_hint_token",
    name: "Quiz Hint Token",
    description: "Remove one wrong answer in quizzes",
    effectDetail: "During any MCQ question, tap 'Use hint token' to eliminate one wrong option.",
    cost: 40,
    icon: "💡",
  },
  {
    id: "double_xp_boost",
    name: "Double XP Boost",
    description: "1.5x XP for the next hour",
    effectDetail: "Applies 1.5× multiplier to all XP earned for 60 minutes after purchase.",
    cost: 100,
    icon: "⚡",
  },
  {
    id: "streak_repair",
    name: "Streak Repair",
    description: "Restore a broken streak within 24 hours",
    effectDetail: "Resets a recently broken streak. Must be used within 24 hours of breaking it.",
    cost: 250,
    icon: "🔧",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Returns a human-readable time-remaining string for the XP boost, or null. */
function xpBoostTimeLeft(activeXPBoost: string | null): string | null {
  if (!activeXPBoost) return null;
  const expiresAt = new Date(activeXPBoost).getTime();
  const msLeft = expiresAt - Date.now();
  if (msLeft <= 0) return null;
  const minutes = Math.ceil(msLeft / 60_000);
  return `${minutes} min remaining`;
}

// ────────────────────────────────────────────────────────────────────────────
// ShopItemCard
// ────────────────────────────────────────────────────────────────────────────

function ShopItemCard({ item, coins }: { item: ShopItem; coins: number }) {
  const spendCoins = useStore((s) => s.spendCoins);
  const addStreakFreeze = useStore((s) => s.addStreakFreeze);
  const activateXPBoost = useStore((s) => s.activateXPBoost);
  const addHintToken = useStore((s) => s.addHintToken);
  const activateStreakRepair = useStore((s) => s.activateStreakRepair);
  const streakFreezes = useStore((s) => s.streakFreezes);
  const hintTokens = useStore((s) => s.hintTokens);
  const activeXPBoost = useStore((s) => s.activeXPBoost);
  const streakRepairAvailable = useStore((s) => s.streakRepairAvailable);
  const canAfford = coins >= item.cost;

  // Owned-count badge text for items tracked in the store
  const ownedBadge: string | null = (() => {
    if (item.id === "streak_freeze" && streakFreezes > 0)
      return `${streakFreezes} owned`;
    if (item.id === "quiz_hint_token" && hintTokens > 0)
      return `${hintTokens} owned`;
    if (item.id === "double_xp_boost") {
      const left = xpBoostTimeLeft(activeXPBoost);
      return left ? `Active — ${left}` : null;
    }
    if (item.id === "streak_repair" && streakRepairAvailable)
      return "Active";
    return null;
  })();

  async function handleBuy() {
    const success = spendCoins(item.cost, item.name);
    if (!success) {
      toast.error("Not enough coins", {
        description: `You need ${item.cost} coins. You have ${coins}.`,
      });
      return;
    }

    // Apply item effect in the Zustand store
    if (item.id === "streak_freeze") {
      addStreakFreeze();
    } else if (item.id === "double_xp_boost") {
      activateXPBoost();
    } else if (item.id === "quiz_hint_token") {
      addHintToken();
    } else if (item.id === "streak_repair") {
      activateStreakRepair();
    }

    // Add to Dexie inventory
    await db.inventory
      .add({
        itemType: "shop_item",
        itemId: item.id,
        acquiredAt: new Date(),
        equipped: false,
      })
      .catch(() => {});

    const effectMessages: Record<string, string> = {
      streak_freeze: "Your streak is protected for one missed day.",
      double_xp_boost: "1.5x XP is active for the next hour!",
      quiz_hint_token: "Use it during a quiz to reveal the answer for one option.",
      streak_repair: "You can restore a broken streak within 24 hours.",
    };

    toast.success(`Purchased: ${item.name}`, {
      description: effectMessages[item.id] ?? "Added to your inventory.",
      icon: item.icon,
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-surface p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="text-4xl">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-bold text-foreground leading-tight">{item.name}</h3>
            {ownedBadge && (
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-2 py-0.5 text-[10px] font-semibold text-saffron">
                {ownedBadge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          <p className="text-xs text-muted-foreground/70 mt-1 italic">{item.effectDetail}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="text-gold">🪙</span>
          <span className="text-gold tabular-nums">{item.cost}</span>
        </div>
        <button
          onClick={handleBuy}
          disabled={!canAfford}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            canAfford
              ? "bg-saffron text-background hover:bg-saffron/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {canAfford ? "Buy" : "Not enough coins"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shop Page
// ────────────────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const coins = useStore((s) => s.coins);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Vidya Coin Shop</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Spend your hard-earned coins on learning power-ups
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2">
          <span className="text-xl">🪙</span>
          <div>
            <p className="font-heading font-bold text-gold tabular-nums">
              {coins.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p>
          </div>
        </div>
      </div>

      {/* ── Item grid ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SHOP_ITEMS.map((item) => (
          <ShopItemCard key={item.id} item={item} coins={coins} />
        ))}
      </div>

      {/* ── How to earn ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/30 bg-surface/50 p-5">
        <h2 className="font-heading text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
          How to Earn Coins
        </h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Complete a quiz: +2 coins (base) · +5 bonus for 100% score</li>
          <li>Complete a plan session: +1 coin</li>
          <li>Daily challenge: +3 coins</li>
          <li>Maintain your daily streak: +1 coin/day</li>
          <li>Weekly test: +10 coins · Monthly test: +25 coins</li>
          <li>Streak milestones: +15 coins (7 days), +50 coins (30 days)</li>
        </ul>
      </div>
    </div>
  );
}
