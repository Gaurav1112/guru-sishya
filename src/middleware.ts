import type { MiddlewareHandler } from "astro";

// Auth disabled — all routes are public.
// Security headers are set on every response.
export const onRequest: MiddlewareHandler = async (_ctx, next) => {
  const response = await next();
  const h = response.headers;

  // Prevent clickjacking
  h.set("X-Frame-Options", "DENY");
  // Prevent MIME-type sniffing
  h.set("X-Content-Type-Options", "nosniff");
  // Limit referrer to origin only on cross-origin requests
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Disable sensors/camera/mic that the app never needs
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  // Content Security Policy — unsafe-inline/eval required by React inline styles,
  // Framer Motion, and Monaco Editor; tighten if a nonce strategy is adopted later.
  h.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
};
