import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";
import type { MiddlewareHandler } from "astro";

const isPublicRoute = createRouteMatcher([
  "/",
  "/app(.*)",
  "/learn(.*)",
  "/questions-bank(.*)",
  "/system-design-interview",
  "/backend-interview",
  "/database-interview",
  "/cloud-devops-interview",
  "/behavioral-interview",
  "/dsa-interview-questions",
  "/senior-backend-interview",
  "/top-coding-questions",
  "/leetcode-alternative",
  "/contact",
  "/privacy",
  "/terms",
  "/login(.*)",
  "/sso-callback(.*)",
  "/ref/(.*)",
  "/api/contact",
  "/api/email-capture",
  "/api/og",
]);

// Gracefully skip Clerk when keys aren't configured (e.g. preview deploys)
const clerkEnabled = Boolean(import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY);

export const onRequest: MiddlewareHandler = clerkEnabled
  ? clerkMiddleware((auth, context) => {
      if (!isPublicRoute(context.request) && !auth().userId) {
        return auth().redirectToSignIn();
      }
    })
  : ((_ctx, next) => next());
