import type { MiddlewareHandler } from "astro";

// Auth disabled — all routes are public
export const onRequest: MiddlewareHandler = (_ctx, next) => next();
