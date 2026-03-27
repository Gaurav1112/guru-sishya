"use client";

import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { TOUR_STEPS } from "./tour-steps";
import { TourStep } from "./tour-step";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { onboardingCompleted, setOnboardingCompleted, visitCount, incrementVisitCount } = useStore();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(-1);
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (pathname === "/app/dashboard" && !hasIncremented.current) {
      hasIncremented.current = true;

      // Only show tour at most twice per week (every 3.5+ days)
      const lastShown = localStorage.getItem("gs-tour-last-shown");
      const daysSinceLastShown = lastShown
        ? (Date.now() - parseInt(lastShown, 10)) / (1000 * 60 * 60 * 24)
        : Infinity;

      if (!onboardingCompleted && daysSinceLastShown >= 3.5) {
        setCurrentStep(0);
        localStorage.setItem("gs-tour-last-shown", String(Date.now()));
      }
      incrementVisitCount();
    }
  }, [pathname, incrementVisitCount, onboardingCompleted]);

  function handleNext() {
    if (currentStep >= TOUR_STEPS.length - 1) {
      setOnboardingCompleted(true);
      setCurrentStep(-1);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleSkip() {
    setOnboardingCompleted(true);
    setCurrentStep(-1);
  }

  useEffect(() => {
    function handleReplay() { setCurrentStep(0); }
    window.addEventListener("replay-tour", handleReplay);
    return () => window.removeEventListener("replay-tour", handleReplay);
  }, []);

  return (
    <>
      {children}
      {currentStep >= 0 && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[9998]" />
          <TourStep step={TOUR_STEPS[currentStep]} stepNumber={currentStep + 1} totalSteps={TOUR_STEPS.length} onNext={handleNext} onSkip={handleSkip} />
        </>
      )}
    </>
  );
}
