"use client";

import { use, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLiveQuery } from "dexie-react-hooks";
import { Loader2, ArrowLeft, ArrowRight, Clock, Target, BookOpen, HelpCircle, Star, CheckCircle2, ChevronDown, ChevronUp, Zap, Terminal, Lock } from "lucide-react";
import { FloatingStickyNotes } from "@/components/floating-sticky-notes";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { generateFlashcardsFromSession } from "@/lib/flashcard-generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUserStats, checkAndUnlockBadges } from "@/lib/gamification/badges";
import { PremiumGate } from "@/components/premium-gate";
import type { GeneratedPlan } from "@/lib/plan/types";
import type { LangCode } from "@/components/code-tabs";
import type { PlaygroundLanguage } from "@/components/code-playground";

const FREE_SESSION_LIMIT = 2;

// Dynamic imports — Monaco must never run on the server
const CodePlayground = dynamic(
  () => import("@/components/code-playground").then((m) => m.CodePlayground),
  { ssr: false }
);

const CodeTabs = dynamic(
  () => import("@/components/code-tabs").then((m) => m.CodeTabs),
  { ssr: false }
);

// ── Extended session type (content + takeaways may come from static content) ──

interface SessionWithContent {
  sessionNumber: number;
  title: string;
  paretoJustification: string;
  objectives: string[];
  activities: { description: string; durationMinutes: number }[];
  resources: { title: string; type: string; url?: string }[];
  reviewQuestions: string[];
  successCriteria: string;
  // Extended fields present in rich content
  content?: string;
  keyTakeaways?: string[];
  hookQuestion?: string;
  realWorldMotivation?: string;
  estimatedMinutes?: number;
  difficulty?: string;
}

// ── Review question with toggle ───────────────────────────────────────────────

function ReviewQuestion({ question, index }: { question: string; index: number }) {
  // Questions may be plain strings or JSON-encoded "question:::answer" pairs
  const parts = question.split(":::");
  const q = parts[0].trim();
  const answer = parts[1]?.trim();

  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
      <p className="text-sm font-medium text-foreground">
        <span className="text-muted-foreground mr-2">{index + 1}.</span>
        {q}
      </p>
      {answer ? (
        <>
          {revealed ? (
            <div className="rounded-md bg-teal/10 border border-teal/20 p-2.5 text-sm text-muted-foreground">
              {answer}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="text-xs text-teal hover:text-teal/80 transition-colors underline-offset-2 hover:underline"
            >
              Show Answer
            </button>
          )}
        </>
      ) : (
        <>
          {revealed ? (
            <div className="rounded-md bg-muted/40 border border-border p-2.5 text-sm text-muted-foreground italic">
              Refer to the lesson content above for the detailed explanation. Key points to remember: review the concepts covered in this session and try to articulate your understanding in your own words.
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="size-3" />
              Reflect on this...
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Difficulty badge ──────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, { label: string; className: string }> = {
    beginner:     { label: "Beginner",     className: "border-teal/40 text-teal bg-teal/10" },
    easy:         { label: "Easy",         className: "border-teal/40 text-teal bg-teal/10" },
    intermediate: { label: "Intermediate", className: "border-gold/40 text-gold bg-gold/10" },
    medium:       { label: "Medium",       className: "border-gold/40 text-gold bg-gold/10" },
    advanced:     { label: "Advanced",     className: "border-saffron/40 text-saffron bg-saffron/10" },
    hard:         { label: "Hard",         className: "border-saffron/40 text-saffron bg-saffron/10" },
  };
  const entry = map[difficulty.toLowerCase()] ?? { label: difficulty, className: "border-border text-muted-foreground" };
  return (
    <Badge variant="outline" className={cn("text-xs capitalize", entry.className)}>
      {entry.label}
    </Badge>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SessionViewPage({
  params,
}: {
  params: Promise<{ id: string; num: string }>;
}) {
  const { id, num } = use(params);
  const topicId = Number(id);
  const sessionNum = Number(num);

  const hydrated = useHydrated();
  const addXP = useStore((s) => s.addXP);
  const addCoins = useStore((s) => s.addCoins);
  const queueCelebration = useStore((s) => s.queueCelebration);
  const isPremium = useStore((s) => s.isPremium);
  const premiumUntil = useStore((s) => s.premiumUntil);
  const isActivePremium =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  const [completing, setCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  // Load topic
  const topic = useLiveQuery(
    async () => (await db.topics.get(topicId)) ?? null,
    [topicId]
  );

  // Load plan
  const existingPlan = useLiveQuery(
    async () => {
      const plan = await db.learningPlans.where("topicId").equals(topicId).first();
      return plan ?? null;
    },
    [topicId]
  );

  // Load session completion status
  const planSession = useLiveQuery(
    async () => {
      if (!existingPlan?.id) return null;
      const ps = await db.planSessions
        .where("planId")
        .equals(existingPlan.id)
        .filter((r) => r.sessionNumber === sessionNum)
        .first();
      return ps ?? null;
    },
    [existingPlan?.id, sessionNum]
  );

  // Guard: show error if session number is invalid (after all hooks)
  if (isNaN(sessionNum) || sessionNum < 1) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-muted-foreground">Invalid session number.</p>
        <Link href={`/app/topic/${id}/plan`} className="text-saffron hover:underline text-sm">
          &larr; Back to Plan
        </Link>
      </div>
    );
  }

  // Parse plan JSON
  let plan: GeneratedPlan | null = null;
  if (existingPlan) {
    try {
      plan = JSON.parse(existingPlan.sessions as unknown as string) as GeneratedPlan;
    } catch {
      plan = null;
    }
  }

  // Find session by sessionNumber, falling back to array index for content
  // files that omit sessionNumber (e.g. system-design-cases.json)
  const session = (
    plan?.sessions.find((s) => s.sessionNumber === sessionNum) ??
    (sessionNum >= 1 && sessionNum <= (plan?.sessions.length ?? 0)
      ? { ...plan!.sessions[sessionNum - 1], sessionNumber: sessionNum }
      : undefined)
  ) as SessionWithContent | undefined;
  const totalSessions = plan?.sessions.length ?? 0;

  // Loading states
  if (!hydrated || topic === undefined || existingPlan === undefined) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="py-20 text-center text-muted-foreground">Topic not found.</div>
    );
  }

  if (!plan || !session) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-muted-foreground">Session {sessionNum} not found.</p>
        <Link href={`/app/topic/${id}/plan`} className="text-saffron hover:underline text-sm">
          ← Back to Plan
        </Link>
      </div>
    );
  }

  // Gate sessions beyond the free limit for non-premium users
  if (!isActivePremium && sessionNum > FREE_SESSION_LIMIT) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        <div>
          <Link
            href={`/app/topic/${id}/plan`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Plan
          </Link>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-sm text-muted-foreground">Session {sessionNum} of {totalSessions}</p>
          <h1 className="font-heading text-2xl font-bold leading-tight">{session.title}</h1>
        </div>
        <PremiumGate feature="full-sessions" overlay={false} />
      </div>
    );
  }

  const totalMinutes =
    session.estimatedMinutes ??
    (session.activities ?? []).reduce((sum, a) => sum + a.durationMinutes, 0);

  const isCompleted = planSession?.completed ?? false;

  // ── Celebration overlay ───────────────────────────────────────────────────
  const prevNum = sessionNum > 1 ? sessionNum - 1 : null;
  const nextNum = sessionNum < totalSessions ? sessionNum + 1 : null;

  // ── Mark complete handler ────────────────────────────────────────────────────

  async function doMarkComplete() {
    if (!existingPlan?.id) return;
    setShowConfirmComplete(false);
    setCompleting(true);
    try {
      const nowCompleted = !isCompleted;

      // If no planSession row exists yet (static-content plan loaded before the
      // fix), create one on the fly so the toggle works immediately.
      let sessionRow = planSession;
      if (!sessionRow?.id) {
        const newId = await db.planSessions.add({
          planId: existingPlan.id,
          sessionNumber: sessionNum,
          completed: false,
        });
        sessionRow = { id: newId as number, planId: existingPlan.id, sessionNumber: sessionNum, completed: false };
      }

      await db.planSessions.update(sessionRow.id!, {
        completed: nowCompleted,
        completedAt: nowCompleted ? new Date() : undefined,
      });

      if (nowCompleted) {
        addXP(20);
        addCoins(10, "plan_session_complete");
        queueCelebration({ type: "xp_gain", data: { amount: 20 } });
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);

        // Auto-generate flashcards from session review questions
        if (session?.reviewQuestions && session.reviewQuestions.length > 0) {
          generateFlashcardsFromSession(
            topicId,
            session.content ?? "",
            session.reviewQuestions
          ).catch(() => {});
        }

        // Check and unlock badges after session completion
        const storeState = useStore.getState();
        getUserStats({
          currentStreak: storeState.currentStreak,
          longestStreak: storeState.longestStreak,
          totalXP: storeState.totalXP,
          level: storeState.level,
        }).then((stats) => checkAndUnlockBadges(stats)).then((newBadges) => {
          for (const badge of newBadges) {
            queueCelebration({ type: "badge", data: { badge: { name: badge.name, icon: badge.icon } } });
          }
        }).catch(() => {});
      }
    } finally {
      setCompleting(false);
    }
  }

  function handleMarkComplete() {
    if (!isCompleted) {
      // Show inline confirmation instead of blocking window.confirm()
      setShowConfirmComplete(true);
    } else {
      // Marking incomplete needs no confirmation
      doMarkComplete();
    }
  }

  // ── Extract ALL fenced code blocks from session content ─────────────────────

  const SUPPORTED_LANGS = new Set([
    "python", "java", "javascript", "typescript",
    "py", "js", "ts",
    "c", "cpp", "c++",
  ]);

  function normalizeLang(raw: string): PlaygroundLanguage {
    const l = raw.toLowerCase();
    if (l === "py") return "python";
    if (l === "js") return "javascript";
    if (l === "ts") return "typescript";
    if (l === "c++") return "cpp";
    if (l === "python" || l === "java" || l === "javascript" || l === "typescript" || l === "c" || l === "cpp") return l as PlaygroundLanguage;
    return "javascript";
  }

  function extractAllCodeBlocks(md: string | undefined): LangCode[] {
    if (!md) return [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    const blocks: LangCode[] = [];
    const seen = new Set<string>();
    let match;
    while ((match = regex.exec(md)) !== null) {
      const rawLang = match[1].toLowerCase() || "javascript";
      if (!SUPPORTED_LANGS.has(rawLang)) continue; // skip shell, json, etc.
      const lang = normalizeLang(rawLang);
      if (seen.has(lang)) continue; // deduplicate by language
      seen.add(lang);
      blocks.push({ language: lang, code: match[2].trim() });
    }
    return blocks;
  }

  const allCodeBlocks = extractAllCodeBlocks(session.content);
  // Primary code block for single-language playground fallback
  const firstBlock = allCodeBlocks[0] ?? null;
  const playgroundLang = firstBlock ? normalizeLang(firstBlock.language) : "javascript";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* ── Back link ────────────────────────────────────────────────────── */}
      <div>
        <Link
          href={`/app/topic/${id}/plan`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Plan
        </Link>
      </div>

      {/* ── Session header ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            Session {sessionNum} of {totalSessions}
          </span>
          {isCompleted && (
            <Badge variant="outline" className="border-teal/40 text-teal bg-teal/10 text-xs">
              Completed
            </Badge>
          )}
          {session.difficulty && (
            <DifficultyBadge difficulty={session.difficulty} />
          )}
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold leading-tight">
          {session.title}
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
          {session.paretoJustification}
        </p>

        {totalMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>{totalMinutes > 0 ? `${totalMinutes} minutes` : "~30 minutes"}</span>
          </div>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="border-t border-border" />

      {/* ── Hook question ────────────────────────────────────────────────── */}
      {session.hookQuestion && (
        <div className="rounded-xl border border-saffron/30 bg-saffron/5 p-5 sm:p-6">
          <p className="text-xs font-semibold text-saffron uppercase tracking-wide mb-3">
            Before We Begin
          </p>
          <p className="text-base sm:text-lg italic text-foreground leading-relaxed">
            &ldquo;{session.hookQuestion}&rdquo;
          </p>
        </div>
      )}

      {/* ── Real-world motivation ─────────────────────────────────────────── */}
      {session.realWorldMotivation && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gold uppercase tracking-wide">
            Why This Matters
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {session.realWorldMotivation}
          </p>
        </div>
      )}

      {/* ── Objectives ───────────────────────────────────────────────────── */}
      {session.objectives?.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-saffron" />
            <h2 className="text-sm font-semibold text-saffron uppercase tracking-wide">
              Learning Objectives
            </h2>
          </div>
          <ul className="space-y-1.5">
            {session.objectives.map((obj, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-saffron shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Lesson content (markdown) ─────────────────────────────────────── */}
      {session.content && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Lesson
            </h2>
          </div>
          <div
            className={cn(
              "prose prose-invert prose-sm sm:prose-base max-w-none",
              // headings
              "[&_h1]:font-heading [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3",
              "[&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2",
              "[&_h3]:font-heading [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1.5",
              // body
              "[&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3",
              "[&_li]:text-muted-foreground [&_li]:leading-relaxed",
              "[&_strong]:text-foreground [&_strong]:font-semibold",
              "[&_em]:text-foreground/80",
              // code
              "[&_code]:text-saffron [&_code]:bg-muted/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
              "[&_pre]:bg-muted/80 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4",
              "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground/90",
              // tables
              "[&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:my-4",
              "[&_th]:text-left [&_th]:p-2.5 [&_th]:border [&_th]:border-border [&_th]:bg-muted/40 [&_th]:text-foreground [&_th]:font-semibold",
              "[&_td]:p-2.5 [&_td]:border [&_td]:border-border [&_td]:text-muted-foreground",
              // blockquote
              "[&_blockquote]:border-l-2 [&_blockquote]:border-saffron/40 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:my-4",
              // links
              "[&_a]:text-saffron [&_a]:underline-offset-2 [&_a]:hover:underline",
              // horizontal rule
              "[&_hr]:border-border [&_hr]:my-6",
            )}
          >
            <MarkdownRenderer content={session.content} />
          </div>
        </div>
      )}

      {/* ── Multi-language code viewer ────────────────────────────────────── */}
      {allCodeBlocks.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Code Examples
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Toggle between languages to compare implementations.
          </p>
          <CodeTabs
            codes={allCodeBlocks}
            height={320}
            title="Language Comparison"
          />
        </div>
      )}

      {/* ── Try it yourself (Code Playground) ────────────────────────────── */}
      {firstBlock && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-saffron" />
            <h2 className="text-sm font-semibold text-saffron uppercase tracking-wide">
              Try It Yourself
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Modify and run the code below. Your changes stay local — experiment freely.
            {playgroundLang === "python" && (
              <span className="ml-1 text-muted-foreground/60 italic">
                (runs via Wandbox API — may take 2–5 s)
              </span>
            )}
            {playgroundLang === "java" && (
              <span className="ml-1 text-muted-foreground/60 italic">
                (click Run for local javac instructions)
              </span>
            )}
          </p>
          <CodePlayground
            defaultCode={firstBlock.code}
            codeByLanguage={Object.fromEntries(allCodeBlocks.map((b) => [b.language, b.code])) as Partial<Record<PlaygroundLanguage, string>>}
            language={playgroundLang}
            height={320}
            title="Interactive Example"
          />
        </div>
      )}

      {/* ── Key takeaways ─────────────────────────────────────────────────── */}
      {session.keyTakeaways && session.keyTakeaways.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="size-4 text-gold fill-gold/30" />
            <h2 className="text-sm font-semibold text-gold uppercase tracking-wide">
              Key Takeaways
            </h2>
          </div>
          <ul className="space-y-2">
            {session.keyTakeaways.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-gold shrink-0 mt-0.5">★</span>
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Activities ────────────────────────────────────────────────────── */}
      {session.activities?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-teal" />
            <h2 className="text-sm font-semibold text-teal uppercase tracking-wide">
              Activities
            </h2>
          </div>
          <div className="space-y-2">
            {session.activities.map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">
                    {act.description}
                  </p>
                  {act.durationMinutes > 0 && (
                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                      ~{act.durationMinutes} minutes
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Floating sticky notes panel (right side, sticky on scroll) ── */}
      <FloatingStickyNotes topicId={topicId} sessionNum={sessionNum} />

      {/* ── Review questions ──────────────────────────────────────────────── */}
      {session.reviewQuestions?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-4 text-secondary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--secondary))" }}>
              Review Questions
            </h2>
          </div>
          <div className="space-y-2">
            {session.reviewQuestions.map((q, i) => (
              <ReviewQuestion key={i} question={q} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Success criteria ──────────────────────────────────────────────── */}
      {session.successCriteria && (
        <div className="rounded-xl border border-teal/30 bg-teal/5 p-5">
          <p className="text-xs font-semibold text-teal uppercase tracking-wide mb-2">
            Success Criteria
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {session.successCriteria}
          </p>
        </div>
      )}

      {/* ── Resources ─────────────────────────────────────────────────────── */}
      {session.resources?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-gold" />
            <h2 className="text-sm font-semibold text-gold uppercase tracking-wide">
              Resources
            </h2>
          </div>
          <div className="space-y-2">
            {session.resources.map((res, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Badge variant="secondary" className="text-xs shrink-0">
                  {res.type}
                </Badge>
                {res.url ? (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-saffron hover:underline underline-offset-2"
                  >
                    {res.title}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{res.title}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mark complete ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {isCompleted ? "Session completed!" : "Ready to mark this done?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isCompleted
                ? "You earned +20 XP and +10 coins for this session."
                : "Complete this session to earn +20 XP and +10 coins."}
            </p>
          </div>
          <Button
            onClick={handleMarkComplete}
            disabled={completing}
            size="sm"
            className={cn(
              "shrink-0 gap-1.5",
              isCompleted
                ? "bg-muted text-muted-foreground hover:bg-destructive/20 hover:text-destructive border border-border"
                : "bg-teal/20 text-teal border border-teal/40 hover:bg-teal/30"
            )}
            variant="ghost"
          >
            {completing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <Zap className="size-3.5" />
            )}
            {isCompleted ? "Mark Incomplete" : "Mark Complete"}
          </Button>
        </div>

        {showConfirmComplete && (
          <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-3">
            <p className="text-sm font-medium">Mark this session complete?</p>
            <p className="text-xs text-muted-foreground">This will award +20 XP and +10 coins.</p>
            <div className="flex gap-2">
              <Button onClick={doMarkComplete} size="sm" className="bg-teal text-white">Yes, Complete</Button>
              <Button onClick={() => setShowConfirmComplete(false)} size="sm" variant="outline">Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Session navigation ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {prevNum ? (
          <Link
            href={`/app/topic/${id}/plan/session/${prevNum}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>
              <span className="block text-xs text-muted-foreground/70">Previous</span>
              Session {prevNum}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {nextNum ? (
          !isActivePremium && nextNum > FREE_SESSION_LIMIT ? (
            <Link
              href="/app/pricing"
              className="flex items-center gap-2 rounded-lg border border-saffron/40 bg-saffron/5 px-4 py-2.5 text-sm text-saffron hover:bg-saffron/10 transition-colors text-right ml-auto"
            >
              <span>
                <span className="block text-xs text-saffron/70">Next</span>
                Session {nextNum}
              </span>
              <Lock className="size-4" />
            </Link>
          ) : (
            <Link
              href={`/app/topic/${id}/plan/session/${nextNum}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors group text-right ml-auto"
            >
              <span>
                <span className="block text-xs text-muted-foreground/70">Next</span>
                Session {nextNum}
              </span>
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )
        ) : (
          <div />
        )}
      </div>

      {/* ── Celebration overlay ───────────────────────────────────────────── */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-teal/40 bg-surface/95 px-10 py-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle2 className="size-12 text-teal" />
            <p className="font-heading text-xl font-bold text-foreground">Session Complete!</p>
            <p className="text-sm text-muted-foreground">+20 XP &amp; +10 coins awarded</p>
          </div>
        </div>
      )}
    </div>
  );
}
