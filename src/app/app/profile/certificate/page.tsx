"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2, ArrowLeft, Award } from "lucide-react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { findTopicContent } from "@/lib/content/loader";
import {
  CertificateCard,
  type CertificateData,
} from "@/components/profile/certificate-card";
import { PremiumGate } from "@/components/premium-gate";
import { Button } from "@/components/ui/button";

// ────────────────────────────────────────────────────────────────────────────
// Inner component (needs useSearchParams inside Suspense boundary)
// ────────────────────────────────────────────────────────────────────────────

function CertificateInner() {
  const searchParams = useSearchParams();
  const topicIdParam = searchParams.get("topicId");
  const topicId = topicIdParam ? Number(topicIdParam) : null;
  const hydrated = useHydrated();
  const { data: session } = useSession();
  const displayName = useStore((s) => s.displayName);

  const topic = useLiveQuery(
    async () => (topicId ? (await db.topics.get(topicId)) ?? null : null),
    [topicId]
  );

  const quizAttempts = useLiveQuery(
    async () =>
      topicId ? db.quizAttempts.where("topicId").equals(topicId).toArray() : [],
    [topicId]
  );

  const [topicContent, setTopicContent] = useState<{
    category: string;
    totalQuestions: number;
  } | null>(null);

  // Load topic content to get category and total quiz bank size
  useEffect(() => {
    if (!topic?.name) return;
    findTopicContent(topic.name).then((content) => {
      if (content) {
        setTopicContent({
          category: content.category,
          totalQuestions: content.quizBank?.length ?? 0,
        });
      }
    });
  }, [topic?.name]);

  if (!hydrated || topic === undefined || quizAttempts === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!topicId || !topic) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <p className="text-muted-foreground mb-4">
          No topic specified. Go to your profile to view certificates.
        </p>
        <Link href="/app/profile">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Profile
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate completion stats
  const attempts = quizAttempts ?? [];
  const questionsAnswered = attempts.reduce(
    (acc, q) => acc + (q.questions?.length ?? 0),
    0
  );
  const totalScore = attempts.reduce((acc, q) => acc + q.score, 0);
  const attemptCount = attempts.length;
  const accuracy = attemptCount > 0 ? Math.round(totalScore / attemptCount) : 0;
  const totalQuestions = topicContent?.totalQuestions ?? questionsAnswered;

  // Check eligibility: at least 1 quiz attempt + accuracy >= 70%
  const isEligible = attemptCount > 0 && accuracy >= 70;

  // Find the most recent completion date
  const lastAttempt = attempts.length > 0
    ? attempts.reduce((latest, a) =>
        new Date(a.completedAt) > new Date(latest.completedAt) ? a : latest
      )
    : null;

  const userName =
    session?.user?.name ?? displayName ?? "Learner";

  if (!isEligible) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <Link
          href="/app/profile"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Profile
        </Link>

        <div className="rounded-xl border border-border/50 bg-surface p-8 text-center">
          <Award className="size-12 mx-auto mb-4 text-muted-foreground/40" />
          <h2 className="font-heading text-xl font-bold mb-2">
            Certificate Not Yet Earned
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            To earn a certificate for <strong>{topic.name}</strong>, you need to
            complete at least one quiz with an average accuracy of 70% or higher.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Current Accuracy</p>
              <p
                className={`text-lg font-bold ${accuracy >= 70 ? "text-green-400" : "text-red-400"}`}
              >
                {attemptCount > 0 ? `${accuracy}%` : "N/A"}
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-muted-foreground">Required</p>
              <p className="text-lg font-bold text-[#FDB813]">70%</p>
            </div>
          </div>
          <Link href={`/app/topic/${topicId}/quiz`}>
            <Button className="mt-6 gap-2 bg-saffron text-background hover:opacity-90">
              Take Quiz
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const certData: CertificateData = {
    userName,
    topicName: topic.name,
    topicCategory: topicContent?.category ?? topic.category,
    completedAt: lastAttempt
      ? new Date(lastAttempt.completedAt).toISOString()
      : new Date().toISOString(),
    accuracy,
    questionsAnswered,
    totalQuestions,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Link
        href="/app/profile"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Profile
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-black mb-1">
          Completion Certificate
        </h1>
        <p className="text-muted-foreground">
          You earned this certificate for mastering{" "}
          <strong className="text-foreground">{topic.name}</strong>
        </p>
      </div>

      <PremiumGate feature="certificates" overlay>
        <CertificateCard data={certData} />
      </PremiumGate>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page export — Suspense boundary needed for useSearchParams
// ────────────────────────────────────────────────────────────────────────────

export default function CertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CertificateInner />
    </Suspense>
  );
}
