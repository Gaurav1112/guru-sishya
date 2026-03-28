"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Users, BookOpen, Target, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { storePendingReferral } from "@/lib/gamification/referrals";

const highlights = [
  { icon: BookOpen, label: "138 Topics", description: "From arrays to system design" },
  { icon: Target, label: "1900+ Questions", description: "Adaptive difficulty quizzes" },
  { icon: Users, label: "Mock Interviews", description: "3-round boss fight format" },
  { icon: Zap, label: "100% Free Core", description: "No credit card needed" },
];

export default function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [_stored, setStored] = useState(false);

  useEffect(() => {
    if (code && code.length >= 4 && code.length <= 10) {
      storePendingReferral(code);
      setStored(true);
    }
  }, [code]);

  function handleStart() {
    router.push("/app/topics");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Image
          src="/logo-mark.png"
          alt="Guru Sishya"
          width={48}
          height={48}
          className="opacity-80 hover:opacity-100 transition-opacity"
        />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg rounded-2xl border border-saffron/30 bg-surface p-8 text-center shadow-xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-saffron/10 border border-saffron/30 mb-6"
        >
          <Sparkles className="size-8 text-saffron" />
        </motion.div>

        <h1 className="font-heading text-3xl sm:text-4xl font-black mb-3">
          Your friend invited you to{" "}
          <span className="text-saffron">Guru Sishya</span>
        </h1>

        <p className="text-muted-foreground text-lg mb-2">
          The one-stop platform to ace your software engineering interviews.
        </p>

        <p className="text-sm text-teal font-medium mb-8">
          Join now and get a welcome bonus: +50 XP and +25 coins!
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {highlights.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
              className="rounded-xl border border-border/50 bg-muted/20 p-3 text-left"
            >
              <item.icon className="size-5 text-saffron mb-1.5" />
              <p className="font-heading font-bold text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <Button
          onClick={handleStart}
          size="lg"
          className="w-full bg-saffron hover:bg-saffron/90 text-white font-bold text-lg gap-2"
        >
          Start Free
          <ArrowRight className="size-5" />
        </Button>

        <p className="text-xs text-muted-foreground/60 mt-4">
          No sign-up required. Start learning instantly.
        </p>
      </motion.div>

      <p className="mt-8 text-xs text-muted-foreground/40">
        Referral code: {code.toUpperCase()}
      </p>
    </div>
  );
}
