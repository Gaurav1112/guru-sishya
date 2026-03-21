"use client";

import { use } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { LadderContainer } from "@/components/features/ladder/ladder-container";

export default function LadderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const topic = useLiveQuery(() => db.topics.get(Number(id)), [id]);
  const apiKey = useStore((s) => s.apiKey);

  if (!apiKey) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Set your Claude API key in{" "}
        <a href="/app/settings" className="text-saffron underline">
          Settings
        </a>{" "}
        first.
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Topic not found
      </div>
    );
  }

  return <LadderContainer topicId={topic.id!} topicName={topic.name} />;
}
