"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { BADGE_DEFINITIONS, getUserStats, type BadgeDefinition, type UserStats } from "@/lib/gamification/badges";
import { useStore } from "@/lib/store";
import { BadgeCard } from "./badge-card";

type BadgeCategory = BadgeDefinition["category"];

const CATEGORIES: { id: BadgeCategory; label: string }[] = [
  { id: "consistency", label: "Consistency" },
  { id: "mastery", label: "Mastery" },
  { id: "speed", label: "Speed" },
  { id: "exploration", label: "Exploration" },
  { id: "social", label: "Social" },
];

export function BadgeMandir() {
  const unlockedBadges = useLiveQuery(() => db.badges.toArray(), []);
  const { currentStreak, longestStreak, totalXP, level } = useStore();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    getUserStats({ currentStreak, longestStreak, totalXP, level })
      .then(setUserStats)
      .catch(() => {});
  }, [currentStreak, longestStreak, totalXP, level]);

  const unlockedMap = new Map(
    (unlockedBadges ?? []).map((b) => [b.type, b])
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-bold">Badge Mandir</h3>
        <span className="text-sm text-muted-foreground">
          {unlockedBadges?.length ?? 0}/{BADGE_DEFINITIONS.length} unlocked
        </span>
      </div>

      <Tabs defaultValue="consistency">
        <TabsList className="mb-4 flex flex-wrap gap-1 h-auto">
          {CATEGORIES.map((cat) => {
            const total = BADGE_DEFINITIONS.filter((b) => b.category === cat.id).length;
            const unlocked = BADGE_DEFINITIONS.filter(
              (b) => b.category === cat.id && unlockedMap.has(b.id)
            ).length;
            return (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                {cat.label}
                <span className="ml-1.5 text-muted-foreground">
                  {unlocked}/{total}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CATEGORIES.map((cat) => {
          const badges = BADGE_DEFINITIONS.filter((b) => b.category === cat.id);
          const unlocked = badges.filter((b) => unlockedMap.has(b.id)).length;

          return (
            <TabsContent key={cat.id} value={cat.id}>
              <p className="text-xs text-muted-foreground mb-3">
                {unlocked} of {badges.length} unlocked in this category
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badges.map((badge, i) => {
                  const record = unlockedMap.get(badge.id);
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <BadgeCard
                        badge={badge}
                        unlocked={!!record}
                        unlockedAt={record?.unlockedAt}
                        userStats={userStats ?? undefined}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
