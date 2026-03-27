"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endDate: string;
}

export function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const end = new Date(endDate).getTime();
    function update() {
      const diff = end - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`);
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (expired) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-saffron/10 border border-saffron/20 text-saffron text-sm font-medium">
      <Clock className="size-4" />
      <span>Launch price ends in {timeLeft}</span>
    </div>
  );
}
