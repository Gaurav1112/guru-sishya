"use client";

import { useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { getLevelInfo } from "@/lib/gamification/xp";

interface ShareCardProps {
  badgeCount: number;
  totalQuestions: number;
  accuracy: number;
}

export function ShareCard({ badgeCount, totalQuestions, accuracy }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { totalXP, level, currentStreak, displayName } = useStore();
  const levelInfo = getLevelInfo(level);
  const userName = displayName || "a software engineer";

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#1a1a2e", scale: 2 });
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }, []);

  const shareToLinkedIn = useCallback(() => {
    const text = `🎓 I'm ${userName}, currently at ${levelInfo.tier} level on Guru Sishya!\n\n` +
      `📊 My Interview Prep Stats:\n` +
      `• ${totalXP.toLocaleString()} XP earned\n` +
      `• ${badgeCount} badges unlocked\n` +
      `• ${currentStreak}-day learning streak\n` +
      `• ${totalQuestions} questions answered\n` +
      `• ${accuracy}% accuracy\n\n` +
      `Preparing for software engineering interviews with adaptive quizzes, mock interviews, and spaced repetition.\n\n` +
      `Try it: https://www.guru-sishya.in\n\n` +
      `#InterviewPrep #SoftwareEngineering #GuruSishya #CodingInterview #TechCareer`;

    window.open(
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }, [levelInfo.title, totalXP, badgeCount, currentStreak, totalQuestions, accuracy]);

  const shareToWhatsApp = useCallback(() => {
    const text = `🎓 *Guru Sishya Progress Update*\n\n` +
      `I'm ${userName}, currently at *${levelInfo.tier}* level (Level ${level})!\n\n` +
      `📊 ${totalXP.toLocaleString()} XP | ${badgeCount} Badges | ${currentStreak}-day Streak\n` +
      `📝 ${totalQuestions} questions | ${accuracy}% accuracy\n\n` +
      `Preparing for software engineering interviews!\n` +
      `👉 https://www.guru-sishya.in`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [levelInfo.title, level, totalXP, badgeCount, currentStreak, totalQuestions, accuracy]);

  return (
    <>
      <div className="fixed -left-[9999px] -top-[9999px]">
        <div ref={cardRef} className="w-[600px] h-[340px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 flex flex-col justify-between" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          <div>
            <div className="text-3xl font-bold text-white">Guru Sishya</div>
            <div className="text-[#E85D26] text-lg mt-1">{levelInfo.title} — Level {level}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center"><div className="text-2xl font-bold text-white">{totalXP.toLocaleString()}</div><div className="text-xs text-gray-400">Total XP</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-white">{badgeCount}</div><div className="text-xs text-gray-400">Badges</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-white">{currentStreak}</div><div className="text-xs text-gray-400">Day Streak</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-white">{accuracy}%</div><div className="text-xs text-gray-400">Accuracy</div></div>
          </div>
          <div className="text-xs text-gray-500">guru-sishya.in</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={shareToLinkedIn} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0077B5]/10 text-[#0077B5] text-sm hover:bg-[#0077B5]/20 transition-colors">LinkedIn</button>
        <button onClick={shareToWhatsApp} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] text-sm hover:bg-[#25D366]/20 transition-colors">WhatsApp</button>
      </div>
    </>
  );
}
