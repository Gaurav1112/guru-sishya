"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, StickyNote, GripVertical } from "lucide-react";

interface Note {
  id: string;
  text: string;
  color: string;
  createdAt: string;
}

const NOTE_COLORS = [
  { bg: "bg-yellow-400/15", border: "border-yellow-400/30", text: "text-yellow-300", name: "Yellow" },
  { bg: "bg-pink-400/15", border: "border-pink-400/30", text: "text-pink-300", name: "Pink" },
  { bg: "bg-green-400/15", border: "border-green-400/30", text: "text-green-300", name: "Green" },
  { bg: "bg-blue-400/15", border: "border-blue-400/30", text: "text-blue-300", name: "Blue" },
  { bg: "bg-purple-400/15", border: "border-purple-400/30", text: "text-purple-300", name: "Purple" },
  { bg: "bg-saffron/15", border: "border-saffron/30", text: "text-saffron", name: "Saffron" },
];

function getStorageKey(pageId: string) {
  return `gs-sticky-notes-${pageId}`;
}

function loadNotes(pageId: string): Note[] {
  try {
    const raw = localStorage.getItem(getStorageKey(pageId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(pageId: string, notes: Note[]) {
  try {
    localStorage.setItem(getStorageKey(pageId), JSON.stringify(notes));
  } catch { /* ignore */ }
}

function NoteCard({ note, onDelete, onUpdate }: {
  note: Note;
  onDelete: () => void;
  onUpdate: (text: string) => void;
}) {
  const color = NOTE_COLORS.find((c) => c.name === note.color) ?? NOTE_COLORS[0];
  const [editing, setEditing] = useState(!note.text);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative rounded-lg border ${color.border} ${color.bg} p-3 min-w-[160px] max-w-[240px] shadow-md`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <GripVertical className={`size-3 ${color.text} opacity-40`} />
          <span className={`text-[9px] font-medium uppercase tracking-wider ${color.text} opacity-60`}>
            Note
          </span>
        </div>
        <button
          onClick={onDelete}
          className="flex size-5 items-center justify-center rounded-full hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
        >
          <X className="size-3" />
        </button>
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          autoFocus
          defaultValue={note.text}
          onBlur={(e) => {
            onUpdate(e.target.value);
            if (e.target.value.trim()) setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              onUpdate(target.value);
              if (target.value.trim()) setEditing(false);
            }
          }}
          placeholder="Type your note..."
          className={`w-full bg-transparent border-none outline-none resize-none text-xs leading-relaxed ${color.text} placeholder:opacity-40`}
          rows={3}
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          className={`text-xs leading-relaxed ${color.text} cursor-text whitespace-pre-wrap min-h-[36px]`}
        >
          {note.text || "Click to edit..."}
        </p>
      )}

      {/* Timestamp */}
      <p className="text-[8px] text-muted-foreground/40 mt-1.5">
        {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </p>
    </motion.div>
  );
}

interface StickyNotesProps {
  /** Unique page identifier like "topic-5-session-3" */
  pageId: string;
}

export function StickyNotes({ pageId }: StickyNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);

  // Load notes on mount
  useEffect(() => {
    setNotes(loadNotes(pageId));
  }, [pageId]);

  // Save whenever notes change
  useEffect(() => {
    if (notes.length > 0 || localStorage.getItem(getStorageKey(pageId))) {
      saveNotes(pageId, notes);
    }
  }, [notes, pageId]);

  const addNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: "",
      color: NOTE_COLORS[colorIndex % NOTE_COLORS.length].name,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setColorIndex((i) => i + 1);
    setCollapsed(false);
  }, [colorIndex]);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateNote = useCallback((id: string, text: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text } : n))
    );
  }, []);

  if (notes.length === 0) {
    return (
      <button
        onClick={addNote}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-yellow-400/30 bg-yellow-400/5 px-3 py-2 text-xs font-medium text-yellow-400/70 hover:bg-yellow-400/10 hover:text-yellow-300 transition-colors"
      >
        <StickyNote className="size-3.5" />
        Add Study Note
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1.5 text-xs font-medium text-yellow-400/80 hover:text-yellow-300 transition-colors"
        >
          <StickyNote className="size-3.5" />
          Study Notes ({notes.length})
          <span className="text-[10px] opacity-50">{collapsed ? "▸" : "▾"}</span>
        </button>
        <button
          onClick={addNote}
          className="flex items-center gap-1 rounded-md border border-yellow-400/20 bg-yellow-400/5 px-2 py-1 text-[10px] font-medium text-yellow-400/70 hover:bg-yellow-400/10 transition-colors"
        >
          <Plus className="size-3" />
          Add
        </button>
      </div>

      {/* Notes grid */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onDelete={() => deleteNote(note.id)}
                    onUpdate={(text) => updateNote(note.id, text)}
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
