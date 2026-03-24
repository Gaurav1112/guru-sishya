import type { StateCreator } from "zustand";

// ── State ─────────────────────────────────────────────────────────────────────

export interface PremiumState {
  isPremium: boolean;
  /** ISO date string — when the premium subscription expires */
  premiumUntil: string | null;
  /** Razorpay payment ID of the most recent successful payment */
  paymentId: string | null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export interface PremiumActions {
  /** Called after a successful payment verification response */
  setPremiumStatus: (
    isPremium: boolean,
    premiumUntil: string | null,
    paymentId: string | null
  ) => void;
  /**
   * Checks whether the stored premiumUntil date has passed.
   * If it has, clears premium status. Returns the current isPremium value.
   */
  checkPremiumExpiry: () => boolean;
  /** Activate a 5-day free trial (no payment required) */
  activateFreeTrial: () => void;
}

export type PremiumSlice = PremiumState & PremiumActions;

// ── Slice factory ─────────────────────────────────────────────────────────────

export const createPremiumSlice: StateCreator<
  PremiumSlice,
  [["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  PremiumSlice
> = (set, get) => ({
  // State defaults
  isPremium: false,
  premiumUntil: null,
  paymentId: null,

  // Actions
  setPremiumStatus: (isPremium, premiumUntil, paymentId) =>
    set((state) => {
      state.isPremium = isPremium;
      state.premiumUntil = premiumUntil;
      state.paymentId = paymentId;
    }),

  checkPremiumExpiry: () => {
    const { isPremium, premiumUntil } = get();
    if (!isPremium || !premiumUntil) return false;

    const expired = new Date(premiumUntil) < new Date();
    if (expired) {
      set((state) => {
        state.isPremium = false;
        state.premiumUntil = null;
        state.paymentId = null;
      });
      return false;
    }
    return true;
  },

  activateFreeTrial: () =>
    set((state) => {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 5);
      state.isPremium = true;
      state.premiumUntil = trialEnd.toISOString();
      state.paymentId = "free_trial";
    }),
});
