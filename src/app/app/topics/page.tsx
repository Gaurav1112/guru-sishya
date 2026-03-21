"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { TopicInput } from "@/components/topic-input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopicSkillMap } from "@/components/features/ladder/topic-skill-map";
import Link from "next/link";
import { LayoutGrid, Map } from "lucide-react";

type View = "list" | "map";

export default function TopicsPage() {
  const topics = useLiveQuery(() =>
    db.topics.orderBy("createdAt").reverse().toArray()
  );
  const [view, setView] = useState<View>("list");

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-heading text-2xl font-bold">Your Topics</h1>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="h-7 px-2.5 text-xs gap-1.5"
          >
            <LayoutGrid className="size-3.5" />
            Topics
          </Button>
          <Button
            variant={view === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("map")}
            className="h-7 px-2.5 text-xs gap-1.5"
          >
            <Map className="size-3.5" />
            Knowledge Map
          </Button>
        </div>
      </div>

      <TopicInput />

      {view === "list" ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {topics?.map((t) => (
            <Link key={t.id} href={`/app/topic/${t.id}`}>
              <Card className="bg-surface hover:bg-surface-hover transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="h-3 w-3 rounded-full bg-saffron/60" />
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.category}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {topics?.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-4 mt-8 py-12">
              <span className="text-5xl">📚</span>
              <p className="text-lg font-heading font-semibold">No topics yet</p>
              <p className="text-muted-foreground text-sm">Enter a topic above or pick one to start your journey</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {["System Design", "Machine Learning", "Guitar", "Data Structures"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={async () => {
                      const id = await db.topics.add({ name: t, category: "General", createdAt: new Date() });
                      window.location.href = `/app/topic/${id}`;
                    }}
                    className="rounded-full border border-saffron/30 bg-saffron/10 px-3 py-1 text-sm text-saffron hover:bg-saffron/20 transition-colors cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Your knowledge across all topics — color-coded by retention and Dreyfus level.
            Click any card to go to its Learning Ladder.
          </p>
          <TopicSkillMap />
        </div>
      )}
    </div>
  );
}
