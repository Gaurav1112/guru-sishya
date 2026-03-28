// Guru Sishya — Service Worker for Push Notifications
// This file must live at the root of /public so it has scope over the entire app.

const APP_ICON = "/logo-mark.svg";
const APP_BADGE = "/logo-mark.svg";
const DEFAULT_URL = "/app/dashboard";

// ── Push event — show notification ──────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Guru Sishya",
      body: event.data.text(),
      url: DEFAULT_URL,
    };
  }

  const title = payload.title || "Guru Sishya";
  const options = {
    body: payload.body || "",
    icon: payload.icon || APP_ICON,
    badge: APP_BADGE,
    tag: payload.tag || "guru-sishya-notification",
    renotify: !!payload.renotify,
    data: {
      url: payload.url || DEFAULT_URL,
    },
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click — open or focus the app ─────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || DEFAULT_URL;

  // If an action button was clicked, route to its URL
  const actionUrl = event.action || targetUrl;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing tab
      for (const client of clientList) {
        if (client.url.includes("/app") && "focus" in client) {
          client.navigate(actionUrl);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(actionUrl);
      }
    })
  );
});

// ── Notification close — analytics hook (future) ───────────────────────────

self.addEventListener("notificationclose", (_event) => {
  // Placeholder for analytics tracking in the future
});

// ── Install / Activate — standard lifecycle ────────────────────────────────

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
