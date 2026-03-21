"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export function TopicInput() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    const id = await db.topics.add({ name: topic.trim(), category: "General", createdAt: new Date() });
    router.push(`/app/topic/${id}`);
  }
  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., System Design, Guitar, Machine Learning..." className="bg-surface" disabled={loading} />
      <Button type="submit" disabled={!topic.trim() || loading} className="bg-saffron hover:bg-saffron/90">{loading ? "Creating..." : "Learn"}</Button>
    </form>
  );
}
