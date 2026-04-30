"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, ChevronLeft, ChevronRight } from "lucide-react";
import { StickyNotes } from "@/components/sticky-notes";

interface FloatingStickyNotesProps {
  topicId: number;
  sessionNum: number;
}

export function FloatingStickyNotes({ topicId, sessionNum }: FloatingStickyNotesProps) {
  const [open, setOpen] = useState(false);

  // Guard against NaN/null/undefined params
  if (!topicId || !sessionNum || isNaN(topicId) || isNaN(sessionNum)) {
    return null;
  }

  const pageId = `topic-${topicId}-session-${sessionNum}`;

  return (
    <>
      {/* Toggle button — fixed on right edge, mid-screen */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed right-0 top-1/4 md:top-1/3 z-40 flex items-center gap-1 rounded-l-xl border border-r-0 border-yellow-400/30 bg-yellow-400/10 backdrop-blur-sm px-2 py-3 text-yellow-300 hover:bg-yellow-400/20 transition-colors shadow-lg"
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        title={open ? "Close notes" : "Open study notes"}
      >
        {open ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        <StickyNote className="size-4" />
        {!open && <span className="text-[10px] font-medium writing-mode-vertical hidden sm:block" style={{ writingMode: "vertical-rl" }}>Notes</span>}
      </motion.button>

      {/* Sliding panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] sm:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[300px] sm:w-[280px] border-l border-yellow-400/20 bg-background/98 backdrop-blur-md shadow-2xl shadow-black/30 overflow-y-auto"
            >
              {/* Header with leaf animation */}
              <div className="sticky top-0 z-10 border-b border-yellow-400/20 bg-gradient-to-r from-yellow-950/50 to-background px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="text-xl"
                      animate={{ rotate: [0, -10, 10, -5, 0], y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      🍃
                    </motion.span>
                    <div>
                      <h2 className="text-sm font-bold text-yellow-300">Study Notes</h2>
                      <p className="text-[10px] text-yellow-400/50">Auto-saved • Session {sessionNum}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Falling leaves decoration */}
              <div className="relative overflow-hidden pointer-events-none h-8">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute text-sm opacity-30"
                    initial={{ x: 50 + i * 80, y: -20, rotate: 0 }}
                    animate={{
                      y: 40,
                      x: [50 + i * 80, 30 + i * 80, 60 + i * 80],
                      rotate: [0, 45, -20, 60],
                      opacity: [0.3, 0.5, 0],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      repeatDelay: 4 + i * 2,
                      ease: "easeInOut",
                    }}
                  >
                    {["🍂", "🌿", "🍃"][i]}
                  </motion.span>
                ))}
              </div>

              {/* Notes content */}
              <div className="px-4 pb-6">
                <StickyNotes pageId={pageId} />
              </div>

              {/* Tips */}
              <div className="px-4 pb-4">
                <div className="rounded-lg border border-border/30 bg-surface/50 p-3 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tips</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    • Click a note to edit it<br />
                    • Notes are saved per session<br />
                    • Use them to mark key points for revision
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
