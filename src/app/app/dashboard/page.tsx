"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { TopicInput } from "@/components/topic-input";

export default function DashboardPage() {
  const topicCount = useLiveQuery(() => db.topics.count());
  const apiKey = useStore((s) => s.apiKey);
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="font-heading text-2xl font-bold">Welcome to Guru Sishya</h2>
        <p className="text-muted-foreground">Add your Claude API key in <a href="/app/settings" className="text-saffron underline">Settings</a> to get started.</p>
      </div>
    );
  }
  if (!topicCount || topicCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <h2 className="font-heading text-2xl font-bold">What do you want to learn today?</h2>
        <p className="text-muted-foreground">Enter any topic and Guru Sishya will create your personalized learning journey.</p>
        <TopicInput />
      </div>
    );
  }
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Dashboard</h1>
      <TopicInput />
      <p className="mt-4 text-sm text-muted-foreground">You have {topicCount} topic{topicCount !== 1 ? "s" : ""}. Select one from the sidebar.</p>
    </div>
  );
}
