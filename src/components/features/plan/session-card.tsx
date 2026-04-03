"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Clock, Target, BookOpen, HelpCircle, ExternalLink, Lock, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useStore } from "@/lib/store";
import type { GeneratedSession } from "@/lib/plan/types";

interface SessionWithContent extends GeneratedSession {
  content?: string;
  keyTakeaways?: string[];
}

interface SessionCardProps {
  session: SessionWithContent;
  completed: boolean;
  onComplete: () => void;
  isLoading?: boolean;
  topicId: number;
}

const FREE_SESSION_LIMIT = 3;

export function SessionCard({ session, completed, onComplete, isLoading, topicId }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { isPremium, premiumUntil } = useStore();
  const isActivePremium =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();
  const isLocked = !isActivePremium && session.sessionNumber > FREE_SESSION_LIMIT;

  const totalMinutes = (session.activities ?? []).reduce(
    (sum, a) => sum + a.durationMinutes,
    0
  );

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isLocked
          ? "border-border/50 bg-surface opacity-80"
          : completed
          ? "border-teal/50 bg-teal/5"
          : "border-border bg-surface hover:bg-surface-hover"
      )}
    >
      {/* Header — click anywhere to expand/collapse (locked sessions also expand to show the gate) */}
      <CardHeader
        className={cn("pb-0", !isLocked && "cursor-pointer")}
        onClick={() => !isLocked && setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          {/* Completion toggle — disabled when locked */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!isLocked) onComplete(); }}
            disabled={isLoading || isLocked}
            className={cn(
              "mt-0.5 shrink-0 disabled:opacity-50",
              isLocked ? "text-muted-foreground/40" : "text-teal"
            )}
            aria-label={completed ? "Mark incomplete" : "Mark complete"}
          >
            {isLocked ? (
              <Lock className="size-5" />
            ) : completed ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <Circle className="size-5 text-muted-foreground" />
            )}
          </button>

          {/* Title area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">
                Session {session.sessionNumber}
              </span>
              {!isLocked && !completed && (
                <Badge variant="outline" className="text-teal border-teal/40 bg-teal/10 text-xs">
                  FREE
                </Badge>
              )}
              {completed && !isLocked && (
                <Badge variant="outline" className="text-teal border-teal/40 text-xs">
                  Done
                </Badge>
              )}
              {isLocked && (
                <Badge variant="outline" className="text-saffron border-saffron/40 bg-saffron/10 text-xs flex items-center gap-1">
                  <Lock className="size-3" />
                  PRO
                </Badge>
              )}
            </div>
            <h3
              className={cn(
                "font-heading font-semibold text-sm mt-0.5",
                completed && !isLocked && "line-through text-muted-foreground",
                isLocked && "text-muted-foreground"
              )}
            >
              {session.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {session.paretoJustification}
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{totalMinutes > 0 ? `${totalMinutes} min` : "~30 min"}</span>
            </div>
          </div>

          {/* Open full lesson link — hidden when locked */}
          <Link
            href={`/app/topic/${topicId}/plan/session/${session.sessionNumber}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 flex items-center gap-1 rounded-md border border-saffron/40 bg-saffron/10 px-2.5 py-1 text-xs font-medium text-saffron hover:bg-saffron/20 transition-colors"
            aria-label={isLocked ? "Preview session" : "Open full lesson"}
          >
            <ExternalLink className="size-3" />
            {isLocked ? "Preview" : "Open"}
          </Link>

          {/* Expand toggle — only for unlocked sessions */}
          {!isLocked && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={expanded ? "Collapse session" : "Expand session"}
            >
              {expanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          )}
        </div>
      </CardHeader>

      {/* Expanded body */}
      {expanded && !isLocked && (
        <CardContent className="pt-4 space-y-4">
          {/* Lesson Content — the actual teaching material */}
          {session.content && (
            <div className="rounded-xl border border-saffron/20 bg-saffron/5 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <BookOpen className="size-4 text-saffron" />
                <span className="text-sm font-semibold text-saffron">Lesson Content</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_code]:text-saffron [&_code]:bg-muted/50 [&_pre]:bg-muted/80 [&_pre]:rounded-lg [&_table]:text-sm [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_a]:text-saffron">
                <MarkdownRenderer content={session.content || ""} />
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {session.keyTakeaways && session.keyTakeaways.length > 0 && (
            <div className="rounded-lg border border-gold/20 bg-gold/5 p-3">
              <p className="text-xs font-semibold text-gold mb-2">Key Takeaways</p>
              <ul className="space-y-1">
                {session.keyTakeaways.map((t, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-gold shrink-0">★</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Objectives */}
          {session.objectives?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="size-3.5 text-saffron" />
                <span className="text-xs font-semibold text-saffron uppercase tracking-wide">
                  Objectives
                </span>
              </div>
              <ul className="space-y-1">
                {session.objectives.map((obj, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-saffron shrink-0">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Activities */}
          {session.activities?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="size-3.5 text-teal" />
                <span className="text-xs font-semibold text-teal uppercase tracking-wide">
                  Activities
                </span>
              </div>
              <div className="space-y-2">
                {session.activities.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm rounded-lg bg-muted/40 p-2"
                  >
                    <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
                      {act.durationMinutes} min
                    </Badge>
                    <span className="text-muted-foreground">{act.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {session.resources?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="size-3.5 text-gold" />
                <span className="text-xs font-semibold text-gold uppercase tracking-wide">
                  Resources
                </span>
              </div>
              <div className="space-y-1.5">
                {session.resources.map((res, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {res.type}
                    </Badge>
                    {res.url ? (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-saffron hover:underline"
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

          {/* Review Questions */}
          {session.reviewQuestions?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <HelpCircle className="size-3.5 text-indigo" />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--secondary))" }}>
                  Review Questions
                </span>
              </div>
              <ul className="space-y-1.5">
                {session.reviewQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground italic">
                    {i + 1}. {q.split(":::")[0].trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Criteria */}
          {session.successCriteria && (
            <div className="rounded-lg border border-teal/20 bg-teal/5 p-3">
              <p className="text-xs font-semibold text-teal mb-1">Success Criteria</p>
              <p className="text-sm text-muted-foreground">{session.successCriteria}</p>
            </div>
          )}

          {/* Mark complete / completed button — always visible */}
          <Button
            onClick={onComplete}
            disabled={isLoading || isLocked}
            size="sm"
            className={cn(
              "w-full",
              completed
                ? "bg-teal/10 text-teal border border-teal/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30"
                : "bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30"
            )}
            variant="ghost"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : completed ? (
              <>
                <Check className="size-4 mr-2" />
                Completed — Click to undo
              </>
            ) : (
              <>
                Mark Session Complete (+20 XP, +10 coins)
              </>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
