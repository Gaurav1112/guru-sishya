"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Search, ChevronDown, ChevronUp, ExternalLink, Trash2 } from "lucide-react";
import { db } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawNote {
  id: string;
  text: string;
  color: string;
  createdAt: string;
}

interface NoteEntry {
  topicId: number;
  sessionNum: number;
  note: RawNote;
  sessionHref: string;
}

interface TopicGroup {
  topicId: number;
  topicName: string;
  notes: NoteEntry[];
}

// ── Color map (mirrors sticky-notes.tsx) ────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Yellow:  { bg: "bg-yellow-400/10",  border: "border-yellow-400/25",  text: "text-yellow-300",  dot: "bg-yellow-400" },
  Pink:    { bg: "bg-pink-400/10",    border: "border-pink-400/25",    text: "text-pink-300",    dot: "bg-pink-400" },
  Green:   { bg: "bg-green-400/10",   border: "border-green-400/25",   text: "text-green-300",   dot: "bg-green-400" },
  Blue:    { bg: "bg-blue-400/10",    border: "border-blue-400/25",    text: "text-blue-300",    dot: "bg-blue-400" },
  Purple:  { bg: "bg-purple-400/10",  border: "border-purple-400/25",  text: "text-purple-300",  dot: "bg-purple-400" },
  Saffron: { bg: "bg-saffron/10",     border: "border-saffron/25",     text: "text-saffron",     dot: "bg-saffron" },
};

function getColor(name: string) {
  return COLOR_MAP[name] ?? COLOR_MAP["Yellow"];
}

// ── Parse all sticky-note keys from localStorage ──────────────────────────────

function readAllNoteEntries(): NoteEntry[] {
  const entries: NoteEntry[] = [];
  const prefix = "gs-sticky-notes-topic-";

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;

    // key format: gs-sticky-notes-topic-{topicId}-session-{sessionNum}
    const rest = key.slice(prefix.length); // "{topicId}-session-{sessionNum}"
    const match = rest.match(/^(\d+)-session-(\d+)$/);
    if (!match) continue;

    const topicId = parseInt(match[1], 10);
    const sessionNum = parseInt(match[2], 10);

    let notes: RawNote[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) notes = JSON.parse(raw);
    } catch {
      continue;
    }

    for (const note of notes) {
      if (!note.text?.trim()) continue; // skip empty notes
      entries.push({
        topicId,
        sessionNum,
        note,
        sessionHref: `/app/topic/${topicId}/plan/session/${sessionNum}`,
      });
    }
  }

  return entries;
}

// ── Delete a single note from localStorage ───────────────────────────────────

function deleteNoteFromStorage(topicId: number, sessionNum: number, noteId: string) {
  const key = `gs-sticky-notes-topic-${topicId}-session-${sessionNum}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const notes: RawNote[] = JSON.parse(raw);
    const updated = notes.filter((n) => n.id !== noteId);
    if (updated.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch { /* ignore */ }
}

// ── NoteCard ─────────────────────────────────────────────────────────────────

function NoteCard({
  entry,
  onDelete,
}: {
  entry: NoteEntry;
  onDelete: () => void;
}) {
  const c = getColor(entry.note.color);
  const date = new Date(entry.note.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`relative rounded-lg border ${c.border} ${c.bg} p-3 space-y-2`}
    >
      {/* Color dot + session badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${c.dot} shrink-0`} />
          <Link
            href={entry.sessionHref}
            className={`text-[11px] font-semibold ${c.text} hover:underline underline-offset-2 flex items-center gap-0.5`}
          >
            Session {entry.sessionNum}
            <ExternalLink className="size-2.5 opacity-60" />
          </Link>
        </div>
        <button
          onClick={onDelete}
          title="Delete note"
          className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-500/15 transition-colors"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      {/* Note text */}
      <p className={`text-xs leading-relaxed ${c.text} whitespace-pre-wrap`}>
        {entry.note.text}
      </p>

      {/* Date */}
      <p className="text-[9px] text-muted-foreground/50">{date}</p>
    </motion.div>
  );
}

// ── TopicSection ──────────────────────────────────────────────────────────────

function TopicSection({
  group,
  defaultOpen,
  onDelete,
}: {
  group: TopicGroup;
  defaultOpen: boolean;
  onDelete: (topicId: number, sessionNum: number, noteId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/50 bg-surface/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <StickyNote className="size-4 text-yellow-400/70 shrink-0" />
          <span className="text-sm font-semibold text-foreground truncate">
            {group.topicName}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground bg-surface border border-border/40 rounded-full px-2 py-0.5">
            {group.notes.length} {group.notes.length === 1 ? "note" : "notes"}
          </span>
        </div>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Notes grid */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {group.notes.map((entry) => (
                  <NoteCard
                    key={`${entry.topicId}-${entry.sessionNum}-${entry.note.id}`}
                    entry={entry}
                    onDelete={() => onDelete(entry.topicId, entry.sessionNum, entry.note.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const [allEntries, setAllEntries] = useState<NoteEntry[]>([]);
  const [topicNames, setTopicNames] = useState<Map<number, string>>(new Map());
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage once mounted (client-only)
  useEffect(() => {
    setMounted(true);
    const entries = readAllNoteEntries();
    setAllEntries(entries);

    // Resolve topic names from Dexie
    const topicIds = [...new Set(entries.map((e) => e.topicId))];
    if (topicIds.length > 0) {
      db.topics.bulkGet(topicIds).then((topics) => {
        const map = new Map<number, string>();
        topics.forEach((t) => {
          if (t && t.id != null) map.set(t.id, t.name);
        });
        setTopicNames(map);
      });
    }
  }, []);

  // Handle note deletion
  const handleDelete = (topicId: number, sessionNum: number, noteId: string) => {
    deleteNoteFromStorage(topicId, sessionNum, noteId);
    setAllEntries((prev) =>
      prev.filter(
        (e) => !(e.topicId === topicId && e.sessionNum === sessionNum && e.note.id === noteId)
      )
    );
  };

  // Filter by search term
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return allEntries;
    const q = search.toLowerCase();
    return allEntries.filter((e) => {
      const nameMatch = (topicNames.get(e.topicId) ?? "").toLowerCase().includes(q);
      const textMatch = e.note.text.toLowerCase().includes(q);
      return nameMatch || textMatch;
    });
  }, [allEntries, topicNames, search]);

  // Group by topic
  const topicGroups = useMemo<TopicGroup[]>(() => {
    const map = new Map<number, NoteEntry[]>();
    for (const entry of filteredEntries) {
      const list = map.get(entry.topicId) ?? [];
      list.push(entry);
      map.set(entry.topicId, list);
    }
    return Array.from(map.entries())
      .map(([topicId, notes]) => ({
        topicId,
        topicName: topicNames.get(topicId) ?? `Topic ${topicId}`,
        notes: notes.sort(
          (a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime()
        ),
      }))
      .sort((a, b) => a.topicName.localeCompare(b.topicName));
  }, [filteredEntries, topicNames]);

  const totalNotes = allEntries.length;

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-muted/40 rounded" />
          <div className="h-4 w-56 bg-muted/30 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-surface/40 p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <StickyNote className="size-6 text-yellow-400" />
            My Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalNotes === 0
              ? "No notes yet. Add study notes during any session."
              : `${totalNotes} ${totalNotes === 1 ? "note" : "notes"} across ${topicGroups.length === 0 && search ? "0" : new Set(allEntries.map((e) => e.topicId)).size} ${new Set(allEntries.map((e) => e.topicId)).size === 1 ? "topic" : "topics"}`}
          </p>
        </div>

        {/* Search */}
        {totalNotes > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-saffron/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {totalNotes === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-6">
            <StickyNote className="size-12 text-yellow-400/40 mx-auto" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">No study notes yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Open any topic session and use the Notes panel on the right to capture key points.
            </p>
          </div>
          <Link
            href="/app/topics"
            className="rounded-lg bg-saffron/10 border border-saffron/30 px-4 py-2 text-sm font-medium text-saffron hover:bg-saffron/20 transition-colors"
          >
            Browse Topics
          </Link>
        </div>
      )}

      {/* No search results */}
      {totalNotes > 0 && topicGroups.length === 0 && search && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Search className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No notes match <span className="text-foreground font-medium">"{search}"</span>
          </p>
          <button
            onClick={() => setSearch("")}
            className="text-xs text-saffron hover:underline underline-offset-2"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Topic groups */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {topicGroups.map((group, i) => (
            <motion.div
              key={group.topicId}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <TopicSection
                group={group}
                defaultOpen={topicGroups.length <= 3}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
