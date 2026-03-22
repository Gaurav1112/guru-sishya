"use client";

import { useStore } from "@/lib/store";

// ────────────────────────────────────────────────────────────────────────────
// Low-level tone generator
// ────────────────────────────────────────────────────────────────────────────

export function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine"
) {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = type;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore if AudioContext is unavailable
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Guard: only play when soundEnabled is true in the store
// ────────────────────────────────────────────────────────────────────────────

function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("guru-sishya-store");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { soundEnabled?: boolean } };
    return parsed?.state?.soundEnabled === true;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Preset sounds
// ────────────────────────────────────────────────────────────────────────────

export const sounds = {
  /** Correct answer — high, bright ping */
  correct: () => {
    if (!isSoundEnabled()) return;
    playTone(880, 0.15, "sine");
  },

  /** Wrong answer — low, buzzy tone */
  wrong: () => {
    if (!isSoundEnabled()) return;
    playTone(220, 0.3, "sawtooth");
  },

  /** Level-up — C-E-G arpeggio */
  levelUp: () => {
    if (!isSoundEnabled()) return;
    playTone(523, 0.1, "sine");
    setTimeout(() => playTone(659, 0.1, "sine"), 100);
    setTimeout(() => playTone(784, 0.2, "sine"), 200);
  },

  /** Coin earned — bright square-wave blip */
  coin: () => {
    if (!isSoundEnabled()) return;
    playTone(1318, 0.1, "square");
  },

  /** Badge unlocked — E then A, triumphant */
  badge: () => {
    if (!isSoundEnabled()) return;
    playTone(659, 0.15, "sine");
    setTimeout(() => playTone(880, 0.2, "sine"), 150);
  },

  /** Streak milestone — ascending two-note fanfare */
  streak: () => {
    if (!isSoundEnabled()) return;
    playTone(440, 0.12, "sine");
    setTimeout(() => playTone(660, 0.2, "sine"), 130);
  },

  /** Perfect round — triumphant chord burst */
  perfect: () => {
    if (!isSoundEnabled()) return;
    playTone(523, 0.2, "sine");
    setTimeout(() => playTone(659, 0.2, "sine"), 60);
    setTimeout(() => playTone(784, 0.25, "sine"), 120);
  },
} satisfies Record<string, () => void>;

// ────────────────────────────────────────────────────────────────────────────
// Hook-based variant (reads soundEnabled reactively from the store)
// ────────────────────────────────────────────────────────────────────────────

export function useSounds() {
  const soundEnabled = useStore((s) => s.soundEnabled);

  function play(name: keyof typeof sounds) {
    if (!soundEnabled) return;
    sounds[name]();
  }

  return { play };
}
