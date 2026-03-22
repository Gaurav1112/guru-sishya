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
  cost: number;
  icon: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "streak_freeze",
    name: "Streak Freeze",
    description: "Protect your streak for one missed day",
    cost: 50,
    icon: "🧊",
  },
  {
    id: "quiz_hint_token",
    name: "Quiz Hint Token",
    description: "Remove one wrong answer in quizzes",
    cost: 30,
    icon: "💡",
  },
  {
    id: "double_xp_boost",
    name: "Double XP Boost",
    description: "1.5x XP for your next quiz session",
    cost: 75,
    icon: "⚡",
  },
  {
    id: "streak_repair",
    name: "Streak Repair",
    description: "Restore a broken streak within 24 hours",
    cost: 200,
    icon: "🔧",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// ShopItemCard
// ────────────────────────────────────────────────────────────────────────────

function ShopItemCard({ item, coins }: { item: ShopItem; coins: number }) {
  const spendCoins = useStore((s) => s.spendCoins);
  const addStreakFreeze = useStore((s) => s.addStreakFreeze);
  const activateXPBoost = useStore((s) => s.activateXPBoost);
  const addHintToken = useStore((s) => s.addHintToken);
  const activateStreakRepair = useStore((s) => s.activateStreakRepair);
  const canAfford = coins >= item.cost;

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
          <h3 className="font-heading font-bold text-foreground leading-tight">{item.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
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
          <li>Maintain your daily streak (+1 coin/day)</li>
          <li>Complete quizzes and Feynman sessions</li>
          <li>Unlock badges and hit streak milestones</li>
          <li>Reach level-up thresholds</li>
        </ul>
      </div>
    </div>
  );
}
