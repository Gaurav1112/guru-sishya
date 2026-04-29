"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trophy, Star, Zap, Target, BarChart3, Swords, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BLOOM_LABELS, type BloomLevel } from "@/lib/quiz/types";
import type { QuizResult } from "@/lib/quiz/types";
import type { AnsweredQuestion } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";
import { ShareButton } from "@/components/share-button";
import { ShareButtons } from "@/components/share-buttons";
import { openMitraWithQuizReview } from "@/components/mitra-chat";
import { Bot } from "lucide-react";

// ── Challenge URL builder ─────────────────────────────────────────────────

/**
 * Build a shareable challenge URL.
 *
 * The seed is derived from the current timestamp, clamped to a 6-digit number
 * so URLs stay short. The seed is only used to reproducibly shuffle the quiz
 * bank on the challenge page — it doesn't need to be cryptographically strong.
 */
function buildChallengeUrl(
  topicName: string,
  averageScore: number
): { url: string; seed: number } {
  // Generate a seed once per result (uses epoch seconds, 6 digits)
  const seed = Math.floor(Date.now() / 1000) % 999983; // prime mod keeps it 6 digits
  if (typeof window === "undefined") return { url: "", seed };

  const base = `${window.location.protocol}//${window.location.host}`;
  const params = new URLSearchParams({
    topic: topicName,
    seed: String(seed),
    score: String(averageScore.toFixed(1)),
  });
  return { url: `${base}/app/challenge?${params.toString()}`, seed };
}

interface QuizResultProps {
  result: QuizResult;
  answers: AnsweredQuestion[];
  topicId: number;
  topicName?: string;
  onRetry: () => void;
}

function getAvgScoreColor(avg: number): string {
  if (avg >= 7) return "text-teal";
  if (avg >= 4) return "text-gold";
  return "text-destructive";
}

function StatBadge({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-3 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div className={cn("text-xl font-bold", valueClass)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function QuizResultScreen({
  result,
  answers,
  topicId,
  topicName,
  onRetry,
}: QuizResultProps) {
  const router = useRouter();
  const weakAnswers = answers.filter((a) => a.score < 5);

  // Build challenge link once (lazy — derived on first render in the client)
  const [challengeData] = useState<{ url: string; seed: number }>(() => {
    if (topicName) {
      return buildChallengeUrl(topicName, result.averageScore);
    }
    return { url: "", seed: 0 };
  });

  const myPct = Math.round(result.averageScore * 10);
  const challengeShareText = `I scored ${myPct}% on the ${topicName ?? "quiz"} quiz on Guru Sishya! Can you beat me?`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="text-center">
        <Trophy className="mx-auto mb-2 size-10 text-gold" />
        <h2 className="text-2xl font-heading font-bold">Quiz Complete!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {result.questionsAnswered} question
          {result.questionsAnswered !== 1 ? "s" : ""} answered
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBadge
          icon={<BarChart3 className="size-4" />}
          label="Avg Score"
          value={`${result.averageScore}/10`}
          valueClass={getAvgScoreColor(result.averageScore)}
        />
        <StatBadge
          icon={<CheckCircle className="size-4" />}
          label="Accuracy"
          value={`${myPct}%`}
          valueClass={getAvgScoreColor(result.averageScore)}
        />
        <StatBadge
          icon={<Target className="size-4" />}
          label="Highest Level"
          value={BLOOM_LABELS[result.highestLevel as BloomLevel]}
          valueClass="text-saffron text-base"
        />
        <StatBadge
          icon={<Star className="size-4 fill-gold text-gold" />}
          label="XP Earned"
          value={`+${result.xpEarned}`}
          valueClass="text-gold"
        />
      </div>

      {/* XP + Coins earned */}
      {(result.xpEarned > 0 || result.coinsEarned > 0) && (
        <Card className="border-gold/20 bg-gold/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {result.xpEarned > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 text-gold font-semibold"
                >
                  <Star className="size-5 fill-gold" />
                  <span>+{result.xpEarned} XP</span>
                </motion.div>
              )}
              {result.coinsEarned > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-2 text-saffron font-semibold"
                >
                  <span>🪙</span>
                  <span>+{result.coinsEarned} coins</span>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breaking point info */}
      {result.breakingPoint !== null && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-sm text-center text-muted-foreground">
              Breaking point reached at{" "}
              <span className="font-semibold text-destructive">
                Level {result.breakingPoint} — {BLOOM_LABELS[result.breakingPoint as BloomLevel]}
              </span>
              . Keep practicing to push your limits!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Weak areas */}
      {weakAnswers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Areas to Review ({weakAnswers.length} question{weakAnswers.length !== 1 ? "s" : ""})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {weakAnswers.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={cn(
                    "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    a.score === 0 ? "bg-destructive/20 text-destructive" : "bg-gold/20 text-gold"
                  )}>
                    {a.score}/10
                  </span>
                  <span className="text-muted-foreground line-clamp-2">
                    {a.question.substring(0, 120)}
                    {a.question.length > 120 ? "..." : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* All correct celebration */}
      {weakAnswers.length === 0 && result.questionsAnswered > 0 && (
        <Card className="border-teal/30 bg-teal/5">
          <CardContent className="pt-4">
            <p className="text-sm text-center text-teal font-medium">
              Outstanding! You answered all questions well. Keep pushing to higher difficulty levels!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ask Study Buddy to review wrong answers */}
      {weakAnswers.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            openMitraWithQuizReview(
              weakAnswers.map((a) => ({
                question: a.question,
                userAnswer: a.userAnswer,
                correctAnswer: a.perfectAnswer || a.feedback,
              }))
            );
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 hover:text-indigo-200"
        >
          <Bot className="size-4" />
          Review your mistakes with Study Buddy
        </motion.button>
      )}

      {/* Challenge a Friend */}
      {topicName && challengeData.url && (
        <Card className="border-saffron/20 bg-gradient-to-br from-saffron/5 to-gold/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-saffron">
              <Swords className="size-4" />
              Challenge a Friend
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              You scored{" "}
              <span className="font-bold text-foreground">{myPct}%</span> on{" "}
              <span className="font-medium text-foreground">{topicName}</span>.
              Dare your friends to beat your score!
            </p>
            <ShareButtons
              shareUrl={challengeData.url}
              shareText={challengeShareText}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onRetry} variant="outline" className="flex-1">
          Try Again
        </Button>
        <ShareButton
          type="quiz"
          value={myPct}
          name={topicName}
          className="flex-1"
          size="default"
        />
        <Button
          onClick={() => router.push(`/app/topic/${topicId}`)}
          className="flex-1"
        >
          Back to Topic
        </Button>
      </div>
    </motion.div>
  );
}
