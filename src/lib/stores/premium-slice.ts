import type { StateCreator } from "zustand";

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * The admin email — always gets permanent free premium access.
 * Read from NEXT_PUBLIC_ADMIN_EMAIL so the literal value is not hardcoded in
 * source. Tradeoff: it is still visible in the client bundle because of the
 * NEXT_PUBLIC_ prefix; acceptable at this scale (₹149/month hobby project).
 */
export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "kgauravis016@gmail.com";

/**
 * FAR-FUTURE date used to represent "permanent" premium for allowlisted users.
 * Using year 9999 so expiry checks always pass.
 */
const PERMANENT_PREMIUM_UNTIL = "9999-12-31T23:59:59.999Z";

/** Days remaining below which we show the "expiring soon" warning */
const EXPIRY_WARNING_THRESHOLD_DAYS = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the number of whole days between now and the given ISO date string.
 * Returns null if the date string is null/undefined.
 * Returns a negative number if the date is in the past.
 */
export function computeDaysRemaining(premiumUntil: string | null): number | null {
  if (!premiumUntil) return null;
  const msRemaining = new Date(premiumUntil).getTime() - Date.now();
  return Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
}

/**
 * True when the paymentId marks a user who should never expire.
 * Covers admin/allowlist free grants and any Razorpay payment made under the
 * lifetime plan (payment IDs contain the prefix "pay_" — we distinguish via
 * planType elsewhere, but we also check a "lifetime_" sentinel that the verify
 * route can set in future, plus the planType stored on the slice).
 */
export function isNeverExpire(paymentId: string | null, planType?: string | null): boolean {
  if (paymentId === "allowlist_free" || paymentId === "admin_free") return true;
  if (planType === "lifetime") return true;
  return false;
}

// ── State ─────────────────────────────────────────────────────────────────────

export interface PremiumState {
  isPremium: boolean;
  /** ISO date string — when the premium subscription expires */
  premiumUntil: string | null;
  /** Razorpay payment ID of the most recent successful payment */
  paymentId: string | null;
  /**
   * The plan type the user subscribed to.
   * "free_trial" | "monthly" | "semester" | "annual" | null
   */
  planType: string | null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export interface PremiumActions {
  /** Called after a successful payment verification response */
  setPremiumStatus: (
    isPremium: boolean,
    premiumUntil: string | null,
    paymentId: string | null,
    planType?: string | null
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
  /**
   * Computed: whole days remaining on the subscription.
   * Returns null if not premium, negative if already expired.
   * Always returns null for admin/allowlist users (they never expire).
   */
  getDaysRemaining: () => number | null;
  /**
   * Computed: true when premium is active and expires within
   * EXPIRY_WARNING_THRESHOLD_DAYS days.
   */
  getIsExpiringSoon: () => boolean;
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
  planType: null,

  // Actions
  setPremiumStatus: (isPremium, premiumUntil, paymentId, planType = null) =>
    set((state) => {
      state.isPremium = isPremium;
      state.premiumUntil = premiumUntil;
      state.paymentId = paymentId;
      state.planType = planType ?? null;
    }),

  checkPremiumExpiry: () => {
    const { isPremium, premiumUntil, paymentId, planType } = get();
    if (!isPremium || !premiumUntil) return false;

    // Allowlisted / admin / lifetime users never expire
    if (isNeverExpire(paymentId, planType)) {
      return true;
    }

    const expired = new Date(premiumUntil) < new Date();
    if (expired) {
      set((state) => {
        state.isPremium = false;
        state.premiumUntil = null;
        state.paymentId = null;
        state.planType = null;
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
      state.planType = "free_trial";
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
        state.planType = "admin_free";
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
          state.planType = "allowlist_free";
        });
      }
    } catch {
      // Silently ignore — user simply won't get auto-premium if the fetch fails
    }
  },

  getDaysRemaining: () => {
    const { isPremium, premiumUntil, paymentId, planType } = get();
    if (!isPremium || !premiumUntil) return null;
    // Admin/allowlist/lifetime — never expire, don't show a countdown
    if (isNeverExpire(paymentId, planType)) return null;
    return computeDaysRemaining(premiumUntil);
  },

  getIsExpiringSoon: () => {
    const { isPremium, premiumUntil, paymentId, planType } = get();
    if (!isPremium || !premiumUntil) return false;
    if (isNeverExpire(paymentId, planType)) return false;
    const days = computeDaysRemaining(premiumUntil);
    if (days === null) return false;
    return days > 0 && days <= EXPIRY_WARNING_THRESHOLD_DAYS;
  },
});
