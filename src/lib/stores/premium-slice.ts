import type { StateCreator } from "zustand";

// ── Constants ─────────────────────────────────────────────────────────────────

/** The admin email — always gets permanent free premium access */
export const ADMIN_EMAIL = "kgauravis016@gmail.com";

/**
 * FAR-FUTURE date used to represent "permanent" premium for allowlisted users.
 * Using year 9999 so expiry checks always pass.
 */
const PERMANENT_PREMIUM_UNTIL = "9999-12-31T23:59:59.999Z";

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
  /**
   * Checks the remote allowlist (/content/premium-emails.json) and grants
   * permanent free premium if the given email is listed.
   * Should be called once after the user's session is known.
   */
  checkAllowlistPremium: (email: string | null | undefined) => Promise<void>;
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
    const { isPremium, premiumUntil, paymentId } = get();
    if (!isPremium || !premiumUntil) return false;

    // Allowlisted users have a permanent paymentId — never expire them
    if (paymentId === "allowlist_free" || paymentId === "admin_free") {
      return true;
    }

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

  checkAllowlistPremium: async (email) => {
    if (!email) return;

    const normalised = email.trim().toLowerCase();

    // Admin always gets free premium — no fetch needed
    if (normalised === ADMIN_EMAIL.toLowerCase()) {
      set((state) => {
        state.isPremium = true;
        state.premiumUntil = PERMANENT_PREMIUM_UNTIL;
        state.paymentId = "admin_free";
      });
      return;
    }

    try {
      const res = await fetch("/api/admin/allowlist");
      if (!res.ok) return;
      const { allowedEmails } = (await res.json()) as { allowedEmails: string[] };
      const isAllowed = allowedEmails
        .map((e: string) => e.trim().toLowerCase())
        .includes(normalised);

      if (isAllowed) {
        set((state) => {
          state.isPremium = true;
          state.premiumUntil = PERMANENT_PREMIUM_UNTIL;
          state.paymentId = "allowlist_free";
        });
      }
    } catch {
      // Silently ignore — user simply won't get auto-premium if the fetch fails
    }
  },
});
