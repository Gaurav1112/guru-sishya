"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Clock, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CalibrationIntroProps {
  topicName: string;
  onStart: () => void;
}

export function CalibrationIntro({ topicName, onStart }: CalibrationIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center gap-6 py-4 text-center"
    >
      {/* Icon */}
      <div className="flex size-20 items-center justify-center rounded-full bg-saffron/10 ring-2 ring-saffron/30">
        <BrainCircuit className="size-10 text-saffron" />
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-heading font-bold">
          Let&apos;s see what you already know
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Before we adapt the quiz to your level, answer 5 quick questions
          about{" "}
          <span className="font-medium text-foreground">{topicName}</span>.
        </p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-3 w-full max-w-xs sm:grid-cols-2 sm:max-w-sm">
        <Card size="sm">
          <CardContent className="pt-3 flex items-center gap-2 text-sm">
            <ListChecks className="size-4 text-saffron shrink-0" />
            <span>5 quick questions</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3 flex items-center gap-2 text-sm">
            <Clock className="size-4 text-saffron shrink-0" />
            <span>About 3 minutes</span>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground max-w-xs">
        Your answers calibrate the difficulty so the quiz stays challenging but
        fair. There&apos;s no penalty for getting these wrong.
      </p>

      {/* CTA */}
      <Button onClick={onStart} size="lg" className="w-full max-w-xs">
        Start Calibration
      </Button>
    </motion.div>
  );
}
