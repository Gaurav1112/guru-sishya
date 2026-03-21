"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { TopicInput } from "@/components/topic-input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function TopicsPage() {
  const topics = useLiveQuery(() => db.topics.orderBy("createdAt").reverse().toArray());
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Your Topics</h1>
      <TopicInput />
      <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {topics?.map((t) => (
          <Link key={t.id} href={`/app/topic/${t.id}`}>
            <Card className="bg-surface hover:bg-surface-hover transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="h-3 w-3 rounded-full bg-saffron/60" />
                <div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.category}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {topics?.length === 0 && <p className="mt-8 text-center text-muted-foreground">No topics yet. Enter a topic above to start learning.</p>}
    </div>
  );
}
