import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/learn(.*)",
  "/questions-bank(.*)",
  "/system-design-interview",
  "/backend-interview",
  "/database-interview",
  "/cloud-devops-interview",
  "/behavioral-interview",
  "/dsa-interview-questions",
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

export const onRequest = clerkMiddleware((auth, context) => {
  if (!isPublicRoute(context.request) && !auth().userId) {
    return auth().redirectToSignIn();
  }
});
