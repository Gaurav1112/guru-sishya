"use client";
import { use } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { PlanContainer } from "@/components/features/plan/plan-container";

export default function PlanPage({
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

  return <PlanContainer topicId={topic.id!} topicName={topic.name} />;
}
