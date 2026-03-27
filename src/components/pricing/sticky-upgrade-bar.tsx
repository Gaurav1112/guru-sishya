"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Crown } from "lucide-react";
import { useStore } from "@/lib/store";

export function StickyUpgradeBar() {
  const isPremium = useStore((s) => s.isPremium);
  const [dismissed, setDismissed] = useState(false);

  if (isPremium || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-saffron/90 to-gold/90 backdrop-blur-sm border-t border-saffron/30 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2 text-background text-sm font-medium">
        <Crown className="size-4" />
        <span>Unlock all features with Pro</span>
        <span className="hidden sm:inline text-background/70">— starting at just Rs.149/mo</span>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/app/pricing" className="px-3 py-1 rounded-lg bg-background text-saffron text-sm font-semibold hover:bg-background/90 transition-colors">Upgrade</Link>
        <button onClick={() => setDismissed(true)} className="p-1 text-background/70 hover:text-background"><X className="size-4" /></button>
      </div>
    </div>
  );
}
