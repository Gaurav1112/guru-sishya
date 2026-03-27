export function trackEvent(name: string, params?: Record<string, string | number>) {
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as any).gtag("event", name, params);
  }
}
