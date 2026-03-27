"use client";

import { useState, useEffect } from "react";
import { X, Gift } from "lucide-react";
import { EmailCapture } from "./email-capture";

export function ExitIntent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("gs-exit-shown")) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShow(true);
        sessionStorage.setItem("gs-exit-shown", "1");
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    // Delay enabling exit intent by 10 seconds (don't show immediately)
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 10000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-saffron/20 bg-surface p-8 shadow-2xl">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="text-center mb-6">
          <Gift className="size-10 text-saffron mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Wait! Get a Free DSA Cheatsheet
          </h2>
          <p className="text-sm text-muted-foreground">
            Top 50 algorithms and data structures you need to know for your interview.
            Delivered to your inbox instantly.
          </p>
        </div>

        <EmailCapture />

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
