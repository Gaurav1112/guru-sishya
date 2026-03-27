"use client";

import { useState, useEffect, useRef } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { db } from "@/lib/db";

interface BookmarkButtonProps {
  questionId: number;
  questionText: string;
}

export function BookmarkButton({ questionId, questionText: _questionText }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const processing = useRef(false);

  useEffect(() => {
    db.questionBookmarks
      .where({ questionId })
      .first()
      .then((bm) => setBookmarked(bm?.bookmarked ?? false))
      .catch(() => {});
  }, [questionId]);

  async function toggle() {
    if (processing.current) return;
    processing.current = true;
    try {
      const existing = await db.questionBookmarks.where({ questionId }).first();
      if (existing) {
        await db.questionBookmarks.update(existing.id!, { bookmarked: !existing.bookmarked, lastSeenAt: new Date() });
        setBookmarked(!existing.bookmarked);
      } else {
        await db.questionBookmarks.add({ questionId, bookmarked: true, status: "unseen", lastSeenAt: new Date() });
        setBookmarked(true);
      }
    } finally {
      processing.current = false;
    }
  }

  return (
    <button onClick={toggle} className="p-1.5 rounded-md hover:bg-surface-hover transition-colors" title={bookmarked ? "Remove bookmark" : "Bookmark question"}>
      {bookmarked ? <BookmarkCheck className="size-4 text-gold" /> : <Bookmark className="size-4 text-muted-foreground" />}
    </button>
  );
}
