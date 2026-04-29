"use client";

import { useEffect, useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { loadAllContent } from "@/lib/content/loader";

/**
 * Look up a topic by numeric ID from Dexie (IndexedDB).
 *
 * On cold loads (incognito, direct URL, new browser) Dexie is empty, so this
 * hook falls back to loading static content from /public/content/*.json,
 * using the numeric ID as a 1-based index into the topic list.
 *
 * IMPORTANT: When the fallback fires, the topic is **persisted to Dexie** so
 * that all downstream queries (learningPlans, planSessions, quizAttempts, etc.)
 * that rely on `db.topics.get(id)` will work immediately. This eliminates the
 * "Topic not found" error on cold loads to sub-pages like /quiz, /plan, etc.
 *
 * Returns:
 *   - `undefined` while the lookup is still pending (show a spinner)
 *   - `null` if neither Dexie nor static content has a match (show "not found")
 *   - `{ id, name, category }` on success
 */
export function useTopicWithFallback(id: string) {
  const numericId = Number(id);

  // Dexie live query — returns undefined while pending, null when not found
  const topicFromDb = useLiveQuery(
    async () => (await db.topics.get(numericId)) ?? null,
    [numericId],
  );

  const [fallbackTopic, setFallbackTopic] = useState<{
    id: number;
    name: string;
    category?: string;
  } | null>(null);

  const [dbChecked, setDbChecked] = useState(false);

  // Prevent duplicate fallback creation across re-renders
  const fallbackAttempted = useRef(false);

  // Track when the Dexie query has resolved (undefined -> null or a value)
  useEffect(() => {
    if (topicFromDb !== undefined) {
      setDbChecked(true);
    }
  }, [topicFromDb]);

  // When Dexie resolves to null, attempt to create the topic from static content
  useEffect(() => {
    if (!dbChecked || topicFromDb !== null) return;
    if (fallbackAttempted.current) return;
    fallbackAttempted.current = true;

    loadAllContent()
      .then(async (allContent) => {
        const idx = numericId - 1;
        const staticTopic = allContent[idx] ?? null;
        if (!staticTopic) return;

        // Persist to Dexie so that all downstream queries (plan, quiz, etc.)
        // can find the topic via db.topics.get(id). We use put() with the
        // explicit ID so the auto-increment doesn't assign a different one.
        try {
          await db.topics.put({
            id: numericId,
            name: staticTopic.topic,
            category: staticTopic.category,
            createdAt: new Date(),
          });
        } catch {
          // If put fails (e.g. schema constraint), still show fallback in-memory
        }

        setFallbackTopic({
          id: numericId,
          name: staticTopic.topic,
          category: staticTopic.category,
        });
      })
      .catch(() => {
        /* ignore network failures */
      });
  }, [dbChecked, topicFromDb, numericId]);

  // Composite result: prefer Dexie, then fallback, then null
  const topic = topicFromDb ?? fallbackTopic ?? null;

  // Still loading: Dexie hasn't resolved AND we have no fallback yet
  const isLoading = topicFromDb === undefined && !fallbackTopic;

  return { topic, isLoading };
}
