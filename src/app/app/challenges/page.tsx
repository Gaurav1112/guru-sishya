"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Trophy,
  Target,
  Zap,
  Clock,
  Plus,
  Share2,
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart3,
  Users,
  ChevronRight,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type GoalType = "xp" | "questions" | "sessions" | "quiz_score";
type ChallengeStatus = "active" | "completed" | "won" | "lost";
type DurationPreset = "1w" | "1m" | "3m" | "1y" | "custom";

interface Challenge {
  id: string;
  opponentName: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  topic: string;     // "All" or specific
  goalType: GoalType;
  myScore: number;
  opponentScore: number;
  status: ChallengeStatus;
  shareUrl: string;
  createdAt: string; // ISO
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "gs-challenges";

const TOPICS = [
  "All Topics",
  "Data Structures & Algorithms",
  "DSA Patterns",
  "System Design Fundamentals",
  "System Design Cases",
  "Core CS",
  "Design Patterns",
  "Estimation",
  "Interview Framework",
  "Kafka",
  "AWS",
  "Kubernetes & Docker",
];

const GOAL_LABELS: Record<GoalType, { label: string; icon: string; unit: string }> = {
  xp:         { label: "Most XP",             icon: "⚡", unit: "XP" },
  questions:  { label: "Most Questions",       icon: "📝", unit: "Qs" },
  sessions:   { label: "Most Sessions",        icon: "📚", unit: "sessions" },
  quiz_score: { label: "Highest Quiz Score",   icon: "🎯", unit: "%" },
};

const DURATION_PRESETS: { id: DurationPreset; label: string; days: number | null }[] = [
  { id: "1w", label: "1 Week",   days: 7   },
  { id: "1m", label: "1 Month",  days: 30  },
  { id: "3m", label: "3 Months", days: 90  },
  { id: "1y", label: "1 Year",   days: 365 },
  { id: "custom", label: "Custom", days: null },
];

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadChallenges(): Challenge[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Challenge[]) : [];
  } catch {
    return [];
  }
}

function saveChallenges(challenges: Challenge[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.round((e - s) / 86_400_000));
}

function daysElapsed(start: string): number {
  const s = new Date(start).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - s) / 86_400_000));
}

function isExpired(endDate: string): boolean {
  return new Date(endDate).getTime() < Date.now();
}

// ── Score helpers ─────────────────────────────────────────────────────────────

function buildShareUrl(c: Challenge): string {
  if (typeof window === "undefined") return "";
  const base = `${window.location.protocol}//${window.location.host}`;
  const params = new URLSearchParams({
    id:    c.id,
    name:  c.opponentName,  // challenger's display name (the person who created)
    goal:  c.goalType,
    topic: c.topic,
    end:   c.endDate,
    score: String(c.myScore),
  });
  return `${base}/app/challenges/join?${params.toString()}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChallengeStatus }) {
  const map: Record<ChallengeStatus, { label: string; className: string }> = {
    active:    { label: "Active",    className: "bg-saffron/20 text-saffron border-saffron/40" },
    completed: { label: "Completed", className: "bg-muted/60 text-muted-foreground border-border/40" },
    won:       { label: "Won",       className: "bg-green-500/20 text-green-400 border-green-500/40" },
    lost:      { label: "Lost",      className: "bg-red-500/20 text-red-400 border-red-500/40" },
  };
  const { label, className } = map[status];
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold px-1.5 py-0.5", className)}>
      {label}
    </Badge>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function DurationBar({ challenge }: { challenge: Challenge }) {
  const total   = daysBetween(challenge.startDate, challenge.endDate);
  const elapsed = Math.min(daysElapsed(challenge.startDate), total);
  const pct     = Math.round((elapsed / total) * 100);

  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>Day {elapsed} of {total}</span>
        <span>{pct}% elapsed</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-saffron"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── Copy link button ──────────────────────────────────────────────────────────

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-xs"
      onClick={handleCopy}
      title={url}
    >
      {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  );
}

// ── WhatsApp share ────────────────────────────────────────────────────────────

function ShareWhatsApp({ url, name }: { url: string; name: string }) {
  const text = encodeURIComponent(`I've challenged you on Guru Sishya! Accept here: ${url}`);
  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-xs border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
      onClick={() => window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer")}
    >
      <Share2 className="size-3" />
      WhatsApp
    </Button>
  );
}

// ── Challenge card ────────────────────────────────────────────────────────────

function ChallengeCard({
  challenge,
  onDelete,
}: {
  challenge: Challenge;
  onDelete: (id: string) => void;
}) {
  const goal = GOAL_LABELS[challenge.goalType];
  const expired = isExpired(challenge.endDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-border/50 bg-surface">
        <CardContent className="pt-4 pb-4 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">{challenge.status === "won" ? "🏆" : challenge.status === "lost" ? "😤" : "⚔️"}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">vs {challenge.opponentName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {goal.icon} {goal.label} · {challenge.topic}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusBadge status={challenge.status} />
              <button
                onClick={() => onDelete(challenge.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                aria-label="Delete challenge"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Duration bar */}
          {challenge.status === "active" && <DurationBar challenge={challenge} />}

          {/* Scores */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-saffron/5 border border-saffron/20 px-3 py-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">You</p>
              <p className="text-lg font-bold text-saffron font-heading">
                {challenge.myScore.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">{goal.unit}</span>
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/30 px-3 py-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{challenge.opponentName}</p>
              <p className="text-lg font-bold text-foreground font-heading">
                {challenge.opponentScore > 0
                  ? challenge.opponentScore.toLocaleString()
                  : "—"}
                {challenge.opponentScore > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">{goal.unit}</span>
                )}
              </p>
              {challenge.opponentScore === 0 && (
                <p className="text-[10px] text-muted-foreground">Pending</p>
              )}
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="size-3" />
            <span>{formatDate(challenge.startDate)} → {formatDate(challenge.endDate)}</span>
          </div>

          {/* Share row (only for active, non-expired) */}
          {challenge.status === "active" && !expired && (
            <div className="flex gap-2 pt-1 border-t border-border/30">
              <CopyLinkButton url={challenge.shareUrl} />
              <ShareWhatsApp url={challenge.shareUrl} name={challenge.opponentName} />
            </div>
          )}

          {/* Outcome banners */}
          {challenge.status === "won" && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-xs text-green-400 font-medium flex items-center gap-2">
              <Trophy className="size-3.5" />
              You won this challenge!
            </div>
          )}
          {challenge.status === "lost" && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400 font-medium flex items-center gap-2">
              <XCircle className="size-3.5" />
              Better luck next time — keep grinding!
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Create challenge form ─────────────────────────────────────────────────────

function CreateChallengeForm({ onCreated }: { onCreated: (c: Challenge) => void }) {
  const { totalXP } = useStore();

  const [opponentName, setOpponentName] = useState("");
  const [duration, setDuration]         = useState<DurationPreset>("1m");
  const [customStart, setCustomStart]   = useState("");
  const [customEnd, setCustomEnd]       = useState("");
  const [topic, setTopic]               = useState("All Topics");
  const [goalType, setGoalType]         = useState<GoalType>("xp");
  const [error, setError]               = useState("");

  function validate(): string {
    if (!opponentName.trim()) return "Please enter your friend's name.";
    if (duration === "custom") {
      if (!customStart || !customEnd) return "Please pick both start and end dates.";
      if (new Date(customEnd) <= new Date(customStart)) return "End date must be after start date.";
    }
    return "";
  }

  function handleCreate() {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");

    const now   = new Date();
    const start = duration === "custom" ? customStart : now.toISOString().slice(0, 10);
    const preset = DURATION_PRESETS.find((p) => p.id === duration);
    const end   = duration === "custom"
      ? customEnd
      : addDays(now, preset!.days!).toISOString().slice(0, 10);

    const id = generateId();
    // Use the actual current XP as the starting score for "xp" goal
    const myScore = goalType === "xp" ? totalXP : 0;

    const challenge: Challenge = {
      id,
      opponentName: opponentName.trim(),
      startDate:    start,
      endDate:      end,
      topic,
      goalType,
      myScore,
      opponentScore: 0,
      status:       "active",
      shareUrl:     "", // will be set after we have the id
      createdAt:    now.toISOString(),
    };

    // Build share URL now that we have the challenge object
    challenge.shareUrl = buildShareUrl(challenge);

    onCreated(challenge);

    // Reset form
    setOpponentName("");
    setDuration("1m");
    setCustomStart("");
    setCustomEnd("");
    setTopic("All Topics");
    setGoalType("xp");
  }

  return (
    <Card className="border-saffron/20 bg-gradient-to-br from-saffron/5 via-background to-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Swords className="size-4 text-saffron" />
          Create a Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">

        {/* Opponent name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Friend's Name / Handle
          </label>
          <input
            type="text"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="e.g. Gaurav"
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Duration
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDuration(p.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  duration === p.id
                    ? "bg-saffron text-background border-saffron"
                    : "border-border/50 text-muted-foreground hover:border-saffron/50 hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date pickers */}
          <AnimatePresence>
            {duration === "custom" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-saffron/50"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Topic */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Topic
          </label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 text-foreground"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Goal type */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Goal
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(GOAL_LABELS) as [GoalType, typeof GOAL_LABELS[GoalType]][]).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setGoalType(key)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium text-left flex items-center gap-2 transition-colors",
                  goalType === key
                    ? "border-saffron/60 bg-saffron/10 text-saffron"
                    : "border-border/40 text-muted-foreground hover:border-saffron/30 hover:text-foreground"
                )}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="size-3" />
            {error}
          </p>
        )}

        {/* Submit */}
        <Button
          onClick={handleCreate}
          className="w-full bg-saffron text-background hover:bg-saffron/90 font-semibold gap-2"
        >
          <Plus className="size-4" />
          Create Challenge &amp; Get Link
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          A shareable link will be generated. Share it with your friend — no account needed on their end.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/40 py-8 text-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ challenges }: { challenges: Challenge[] }) {
  const active    = challenges.filter((c) => c.status === "active").length;
  const won       = challenges.filter((c) => c.status === "won").length;
  const completed = challenges.filter((c) => c.status !== "active").length;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Active",    value: active,    icon: <Swords className="size-4 text-saffron" /> },
        { label: "Won",       value: won,       icon: <Trophy className="size-4 text-gold" /> },
        { label: "Completed", value: completed, icon: <CheckCircle2 className="size-4 text-green-400" /> },
      ].map(({ label, value, icon }) => (
        <Card key={label} className="border-border/40 bg-surface">
          <CardContent className="pt-3 pb-3 flex flex-col items-center gap-1">
            {icon}
            <p className="text-xl font-bold font-heading">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { icon: <Plus className="size-4 text-saffron" />, text: "Create a challenge and choose a goal & duration" },
    { icon: <Share2 className="size-4 text-saffron" />, text: "Share the link with your friend on WhatsApp or copy it" },
    { icon: <Users className="size-4 text-saffron" />, text: "They accept the challenge and track their own progress" },
    { icon: <Trophy className="size-4 text-gold" />, text: "Compare scores when the deadline hits — winner takes glory!" },
  ];

  return (
    <Card className="border-border/40 bg-surface">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          How It Works
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-saffron/10 border border-saffron/20">
              {step.icon}
            </div>
            <span className="text-muted-foreground">{step.text}</span>
            {i < steps.length - 1 && <ChevronRight className="size-3 text-border shrink-0 ml-auto" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newlyCreated, setNewlyCreated] = useState<Challenge | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setChallenges(loadChallenges());
    setMounted(true);
  }, []);

  // Sync expired active challenges
  useEffect(() => {
    if (!mounted) return;
    const updated = challenges.map((c) => {
      if (c.status === "active" && isExpired(c.endDate)) {
        // Determine win/loss if opponent has a score
        if (c.opponentScore > 0) {
          return { ...c, status: (c.myScore >= c.opponentScore ? "won" : "lost") as ChallengeStatus };
        }
        return { ...c, status: "completed" as ChallengeStatus };
      }
      return c;
    });
    const hasChanges = updated.some((u, i) => u.status !== challenges[i].status);
    if (hasChanges) {
      setChallenges(updated);
      saveChallenges(updated);
    }
  }, [mounted, challenges]);

  const handleCreated = useCallback((c: Challenge) => {
    const updated = [c, ...challenges];
    setChallenges(updated);
    saveChallenges(updated);
    setNewlyCreated(c);
    setShowCreate(false);
  }, [challenges]);

  const handleDelete = useCallback((id: string) => {
    const updated = challenges.filter((c) => c.id !== id);
    setChallenges(updated);
    saveChallenges(updated);
    if (newlyCreated?.id === id) setNewlyCreated(null);
  }, [challenges, newlyCreated]);

  const active    = challenges.filter((c) => c.status === "active");
  const history   = challenges.filter((c) => c.status !== "active");

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-saffron border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <span>⚔️</span> Challenges
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compete with friends — no accounts, no backend, just glory.
          </p>
        </div>
        <Button
          onClick={() => { setShowCreate((v) => !v); setNewlyCreated(null); }}
          className={cn(
            "gap-2 font-semibold shrink-0",
            showCreate
              ? "bg-muted text-foreground hover:bg-muted/80"
              : "bg-saffron text-background hover:bg-saffron/90"
          )}
        >
          {showCreate ? (
            <>Hide</>
          ) : (
            <><Plus className="size-4" /> New Challenge</>
          )}
        </Button>
      </motion.div>

      {/* Stats */}
      {challenges.length > 0 && <StatsStrip challenges={challenges} />}

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CreateChallengeForm onCreated={handleCreated} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Newly created — show the link prominently */}
      <AnimatePresence>
        {newlyCreated && (
          <motion.div
            key="new-challenge-banner"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-green-500/40 bg-green-500/5">
              <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-green-400">Challenge created!</p>
                    <p className="text-[11px] text-muted-foreground">Share this link with {newlyCreated.opponentName}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-background border border-border/40 px-3 py-2 text-xs text-muted-foreground font-mono break-all select-all">
                  {newlyCreated.shareUrl}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <CopyLinkButton url={newlyCreated.shareUrl} />
                  <ShareWhatsApp url={newlyCreated.shareUrl} name={newlyCreated.opponentName} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-[#0A66C2]/40 bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20"
                    onClick={() => {
                      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(newlyCreated.shareUrl)}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <Share2 className="size-3" />
                    LinkedIn
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active challenges */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Swords className="size-4 text-saffron" />
          <h2 className="font-heading font-bold text-base">Active Challenges</h2>
          {active.length > 0 && (
            <span className="rounded-full bg-saffron/20 text-saffron text-[10px] font-bold px-2 py-0.5">
              {active.length}
            </span>
          )}
        </div>

        {active.length === 0 ? (
          <EmptyState message="No active challenges. Create one above and dare a friend!" />
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {active.map((c) => (
                <ChallengeCard key={c.id} challenge={c} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* How it works — show only when no challenges exist */}
      {challenges.length === 0 && <HowItWorks />}

      {/* Challenge history */}
      {history.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-muted-foreground" />
            <h2 className="font-heading font-bold text-base">History</h2>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {history.map((c) => (
                <ChallengeCard key={c.id} challenge={c} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Tip */}
      <div className="rounded-xl border border-border/30 bg-surface px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
        <Target className="size-3.5 mt-0.5 text-saffron shrink-0" />
        <span>
          <strong className="text-foreground">Tip:</strong> Your scores are tracked locally. For "Most XP" challenges,
          the score is your total XP at the time of challenge creation — so progress is the XP you earn <em>during</em> the challenge.
        </span>
      </div>
    </div>
  );
}
