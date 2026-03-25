"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Swords,
  Trophy,
  Target,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Zap,
  BookOpen,
  BarChart3,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type GoalType = "xp" | "questions" | "sessions" | "quiz_score";
type ChallengeStatus = "active" | "completed" | "won" | "lost";

interface Challenge {
  id: string;
  opponentName: string;
  startDate: string;
  endDate: string;
  topic: string;
  goalType: GoalType;
  myScore: number;
  opponentScore: number;
  status: ChallengeStatus;
  shareUrl: string;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "gs-challenges";

const GOAL_META: Record<GoalType, { label: string; icon: JSX.Element; description: string; unit: string }> = {
  xp: {
    label:       "Most XP",
    icon:        <Zap className="size-5 text-saffron" />,
    description: "Earn as much XP as possible by studying, quizzing, and completing sessions.",
    unit:        "XP",
  },
  questions: {
    label:       "Most Questions",
    icon:        <BookOpen className="size-5 text-saffron" />,
    description: "Answer as many questions as you can across any topic.",
    unit:        "questions",
  },
  sessions: {
    label:       "Most Sessions",
    icon:        <BarChart3 className="size-5 text-saffron" />,
    description: "Complete the most learning plan sessions before the deadline.",
    unit:        "sessions",
  },
  quiz_score: {
    label:       "Highest Quiz Score",
    icon:        <Star className="size-5 text-saffron" />,
    description: "Aim for the highest quiz score percentage across any topic.",
    unit:        "%",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}

function daysRemaining(endDate: string): number {
  const ms = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function daysBetween(start: string, end: string): number {
  return Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
  );
}

function buildReturnUrl(challengeId: string): string {
  if (typeof window === "undefined") return "";
  const base = `${window.location.protocol}//${window.location.host}`;
  return `${base}/app/challenges/join?accepted=${challengeId}`;
}

// ── Already accepted banner ───────────────────────────────────────────────────

function AlreadyAccepted({ challenge }: { challenge: Challenge }) {
  const meta = GOAL_META[challenge.goalType];
  const remaining = daysRemaining(challenge.endDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5"
    >
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-12 text-green-400" />
        <h1 className="font-heading text-2xl font-bold mb-1">Challenge Accepted!</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;re competing against{" "}
          <span className="font-semibold text-foreground">{challenge.opponentName}</span>
        </p>
      </div>

      <Card className="border-border/50 bg-surface">
        <CardContent className="pt-4 pb-4 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/40 p-3">
              {meta.icon}
              <p className="text-xs font-semibold mt-1">{meta.label}</p>
              <p className="text-[10px] text-muted-foreground">Goal</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <Calendar className="size-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-semibold">{remaining}d</p>
              <p className="text-[10px] text-muted-foreground">Remaining</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <Trophy className="size-4 mx-auto mb-1 text-gold" />
              <p className="text-xs font-semibold">
                {challenge.opponentScore > 0
                  ? `${challenge.opponentScore.toLocaleString()} ${meta.unit}`
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Their score</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Deadline: <span className="font-medium text-foreground">{formatDate(challenge.endDate)}</span>
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button
          className="w-full bg-saffron text-background hover:bg-saffron/90 font-semibold"
          onClick={() => window.location.href = "/app/dashboard"}
        >
          Start Studying Now
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = "/app/challenges"}
        >
          View My Challenges
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main join page ────────────────────────────────────────────────────────────

export default function JoinChallengePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { totalXP }  = useStore();

  // URL params — set by the challenge creator
  const challengerName  = searchParams.get("name")  ?? "";
  const goalType        = (searchParams.get("goal")  ?? "xp") as GoalType;
  const topic           = searchParams.get("topic") ?? "All Topics";
  const endDate         = searchParams.get("end")   ?? "";
  const challengeId     = searchParams.get("id")    ?? "";
  const opponentScore   = parseInt(searchParams.get("score") ?? "0", 10);
  const acceptedId      = searchParams.get("accepted") ?? "";

  const [accepted, setAccepted]           = useState(false);
  const [acceptedChallenge, setAcceptedChallenge] = useState<Challenge | null>(null);
  const [mounted, setMounted]             = useState(false);
  const [alreadyHave, setAlreadyHave]     = useState(false);

  const meta = GOAL_META[goalType] ?? GOAL_META.xp;

  useEffect(() => {
    setMounted(true);

    // If coming back after accepting
    if (acceptedId) {
      const all = loadChallenges();
      const found = all.find((c) => c.id === acceptedId);
      if (found) {
        setAcceptedChallenge(found);
        setAccepted(true);
      }
      return;
    }

    // Check if this challenge ID already exists in their localStorage
    if (challengeId) {
      const all = loadChallenges();
      if (all.some((c) => c.id === challengeId)) {
        setAlreadyHave(true);
      }
    }
  }, [acceptedId, challengeId]);

  const handleAccept = useCallback(() => {
    const now = new Date();
    const start = now.toISOString().slice(0, 10);
    const id = generateId();

    // Use current XP as the starting point for XP challenges
    const myScore = goalType === "xp" ? totalXP : 0;

    const challenge: Challenge = {
      id,
      opponentName:  challengerName || "Friend",
      startDate:     start,
      endDate:       endDate || now.toISOString().slice(0, 10),
      topic,
      goalType,
      myScore,
      opponentScore, // their score embedded in the URL
      status:        "active",
      shareUrl:      buildReturnUrl(id),
      createdAt:     now.toISOString(),
    };

    const existing = loadChallenges();
    saveChallenges([challenge, ...existing]);

    // Navigate to the accepted confirmation view
    const params = new URLSearchParams(searchParams.toString());
    params.set("accepted", id);
    router.replace(`/app/challenges/join?${params.toString()}`);
  }, [challengerName, goalType, topic, endDate, opponentScore, totalXP, searchParams, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-saffron border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Accepted confirmation ───────────────────────────────────────────────────

  if (accepted && acceptedChallenge) {
    return (
      <div className="max-w-xl mx-auto">
        <AlreadyAccepted challenge={acceptedChallenge} />
      </div>
    );
  }

  // ── Invalid link ────────────────────────────────────────────────────────────

  if (!challengerName || !endDate) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <Swords className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="font-heading text-2xl font-bold mb-2">Invalid Challenge Link</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This link appears to be incomplete or expired. Ask your friend to share a fresh challenge link.
        </p>
        <Button onClick={() => router.push("/app/dashboard")}>
          <ArrowLeft className="size-4" />
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // ── Expired ─────────────────────────────────────────────────────────────────

  const isExpired = new Date(endDate).getTime() < Date.now();
  if (isExpired) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <Trophy className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="font-heading text-2xl font-bold mb-2">Challenge Expired</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This challenge from{" "}
          <span className="font-semibold text-foreground">{challengerName}</span> ended on{" "}
          {formatDate(endDate)}. The deadline has passed.
        </p>
        <Button onClick={() => router.push("/app/challenges")}>
          Create Your Own Challenge
        </Button>
      </div>
    );
  }

  const totalDays = daysBetween(new Date().toISOString().slice(0, 10), endDate);
  const remaining = daysRemaining(endDate);

  // ── Landing view ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col gap-5"
      >
        {/* Hero card */}
        <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-gold/5 to-teal/5 p-6 text-center">
          <Swords className="mx-auto mb-3 size-12 text-saffron" />
          <h1 className="font-heading text-2xl font-bold mb-1">
            {challengerName} has challenged you!
          </h1>
          <p className="text-sm text-muted-foreground">
            They want to compete on{" "}
            <span className="font-semibold text-foreground">{topic}</span>.
            Do you accept?
          </p>
        </div>

        {/* Challenge details */}
        <Card className="border-border/50 bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="size-4 text-saffron" />
              Challenge Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* 3-stat grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/40 p-3">
                {meta.icon}
                <p className="text-xs font-semibold mt-1">{meta.label}</p>
                <p className="text-[10px] text-muted-foreground">Goal</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <Calendar className="size-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-semibold">{totalDays} days</p>
                <p className="text-[10px] text-muted-foreground">Duration</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <Trophy className="size-4 mx-auto mb-1 text-gold" />
                <p className="text-xs font-semibold">
                  {opponentScore > 0 ? `${opponentScore.toLocaleString()} ${meta.unit}` : "?"}
                </p>
                <p className="text-[10px] text-muted-foreground">Their score</p>
              </div>
            </div>

            {/* Goal description */}
            <div className="rounded-lg bg-saffron/5 border border-saffron/20 px-3 py-2.5 text-xs text-muted-foreground flex items-start gap-2">
              {meta.icon}
              <span>{meta.description}</span>
            </div>

            {/* Deadline */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Deadline: <span className="font-medium text-foreground">{formatDate(endDate)}</span>
              </span>
              <span className={cn(
                "font-semibold",
                remaining <= 3 ? "text-red-400" : remaining <= 7 ? "text-saffron" : "text-green-400"
              )}>
                {remaining} day{remaining !== 1 ? "s" : ""} left
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Already accepted notice */}
        {alreadyHave && (
          <div className="rounded-lg border border-saffron/30 bg-saffron/10 px-4 py-3 text-sm text-saffron flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            You&apos;ve already accepted this challenge. Track it in your challenges hub.
          </div>
        )}

        {/* CTA */}
        {!alreadyHave ? (
          <Button
            size="lg"
            className="w-full bg-saffron text-background hover:bg-saffron/90 font-bold text-base gap-2"
            onClick={handleAccept}
          >
            <Swords className="size-5" />
            Accept Challenge
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full font-bold text-base gap-2"
            onClick={() => router.push("/app/challenges")}
          >
            View My Challenges
          </Button>
        )}

        {/* Don't want to compete */}
        <button
          type="button"
          onClick={() => router.push("/app/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
        >
          Not interested — go to dashboard
        </button>

        {/* What happens when accepted */}
        <Card className="border-border/30 bg-surface">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              What happens when you accept?
            </p>
            <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
              {[
                "The challenge is saved to your device — no account needed.",
                "Your current progress is recorded as a baseline.",
                "Track your challenge from the Challenges hub in the sidebar.",
                "When the deadline hits, compare scores and claim bragging rights!",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-green-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
