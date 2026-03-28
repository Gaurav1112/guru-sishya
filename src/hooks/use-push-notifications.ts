"use client";

import { useCallback, useEffect, useState } from "react";

const SW_PATH = "/sw.js";
const STORAGE_KEY = "guru-sishya-push-subscription";

export interface UsePushNotifications {
  /** Whether the browser supports notifications + service workers */
  supported: boolean;
  /** Current permission state: "default" | "granted" | "denied" */
  permission: NotificationPermission | "unsupported";
  /** Whether the user is currently subscribed */
  subscribed: boolean;
  /** Request permission and subscribe */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe and remove stored subscription */
  unsubscribe: () => Promise<void>;
}

function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator;
}

/**
 * Hook for managing browser push notification subscription.
 *
 * Uses the Notification API and Service Worker registration.
 * Stores subscription in localStorage (no server-side push for MVP).
 */
export function usePushNotifications(): UsePushNotifications {
  const [supported] = useState(() => isSupported());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    () => (isSupported() ? Notification.permission : "unsupported")
  );
  const [subscribed, setSubscribed] = useState(false);

  // Check stored subscription on mount
  useEffect(() => {
    if (!supported) return;
    setPermission(Notification.permission);
    const stored = localStorage.getItem(STORAGE_KEY);
    setSubscribed(stored === "true" && Notification.permission === "granted");
  }, [supported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;

    try {
      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return false;

      // Register service worker
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: "/",
      });
      await registration.update();

      // Store subscription status locally
      localStorage.setItem(STORAGE_KEY, "true");
      setSubscribed(true);

      return true;
    } catch (err) {
      console.error("[push-notifications] Subscribe failed:", err);
      return false;
    }
  }, [supported]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!supported) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
      if (registration) {
        const subscription = await registration.pushManager?.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
    } catch (err) {
      console.error("[push-notifications] Unsubscribe failed:", err);
    }

    localStorage.removeItem(STORAGE_KEY);
    setSubscribed(false);
  }, [supported]);

  return { supported, permission, subscribed, subscribe, unsubscribe };
}
