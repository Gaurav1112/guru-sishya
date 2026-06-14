# Astro Migration Design

**Date:** 2026-06-14
**Status:** Approved
**Goal:** Migrate guru-sishya.in from Next.js 16 to Astro to resolve Core Web Vitals failures, indexing issues, and poor rankings by shipping zero JS on public pages.

---

## 1. Architecture Overview

One Astro project replaces the Next.js project in the same repository. Astro runs in `output: "server"` mode with `@astrojs/vercel` adapter (same Vercel deployment).

### Directory structure

```
src/
├── pages/                  # replaces Next.js app/ router
│   ├── index.astro         # landing page — zero JS
│   ├── learn/
│   │   ├── index.astro
│   │   └── [slug].astro    # SSG via getStaticPaths
│   ├── questions-bank/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── system-design-interview.astro
│   ├── backend-interview.astro
│   ├── database-interview.astro
│   ├── cloud-devops-interview.astro
│   ├── behavioral-interview.astro
│   ├── dsa-interview-questions.astro
│   ├── top-coding-questions.astro
│   ├── leetcode-alternative.astro
│   ├── contact.astro
│   ├── privacy.astro
│   ├── terms.astro
│   ├── login.astro
│   ├── sso-callback.astro
│   ├── ref/[code].astro
│   ├── app/                # authenticated area — Astro shells + React islands
│   │   ├── dashboard.astro
│   │   ├── topics.astro
│   │   ├── topic/[id].astro
│   │   ├── topic/[id]/quiz.astro
│   │   ├── topic/[id]/cheatsheet.astro
│   │   ├── topic/[id]/feynman.astro
│   │   ├── topic/[id]/ladder.astro
│   │   ├── topic/[id]/plan.astro
│   │   ├── topic/[id]/plan/session/[num].astro
│   │   ├── topic/[id]/resources.astro
│   │   ├── challenges.astro
│   │   ├── challenge.astro
│   │   ├── interview.astro
│   │   ├── leaderboard.astro
│   │   ├── notes.astro
│   │   ├── playground.astro
│   │   ├── pricing.astro
│   │   ├── profile.astro
│   │   ├── profile/certificate.astro
│   │   ├── profile/referral.astro
│   │   ├── questions.astro
│   │   ├── review.astro
│   │   ├── review/weekly.astro
│   │   ├── review/monthly.astro
│   │   ├── revision.astro
│   │   ├── roadmap.astro
│   │   ├── roadmap/company/[slug].astro
│   │   ├── saved.astro
│   │   ├── settings.astro
│   │   ├── shop.astro
│   │   └── admin/          # admin pages
│   └── api/                # replaces /app/api/
│       ├── ai.ts
│       ├── analytics/pageview.ts
│       ├── auth/[...nextauth].ts
│       ├── contact.ts
│       ├── digest.ts
│       ├── email-capture.ts
│       ├── feedback.ts
│       ├── leaderboard/sync.ts
│       ├── og.ts
│       ├── razorpay/create-order.ts
│       ├── razorpay/verify.ts
│       ├── run-code.ts
│       ├── subscription/check.ts
│       ├── trial/start.ts
│       ├── usage/check.ts
│       ├── usage/increment.ts
│       ├── user/delete-account.ts
│       ├── user/progress.ts
│       └── admin/          # admin API routes
├── layouts/
│   ├── Base.astro          # html/head/body, SEO meta, CSS variables
│   ├── Public.astro        # Base + navbar + footer (marketing pages)
│   └── App.astro           # Base + authenticated sidebar shell
├── components/             # existing React components — unchanged
└── lib/                    # existing lib/ — unchanged
```

**What stays 100% the same:** `src/lib/`, `src/components/`, `public/`, all environment variables, Supabase, Clerk keys, Razorpay config, AI providers.

**What changes:** Routing layer (`.astro` pages), layouts, API route export format, `next/link` → `<a>`, `next/image` → `<Image>` from `astro:assets`, Clerk integration package.

---

## 2. Astro Config

```ts
// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import mcp from "astro-mcp";

export default defineConfig({
  site: "https://www.guru-sishya.in",
  output: "server",
  adapter: vercel(),
  integrations: [
    react(),
    sitemap(),
    mcp(),       // auto-generates .mcp.json for Claude Code on astro dev
  ],
  vite: {
    resolve: {
      alias: { "@": "/src" },
    },
  },
});
```

`astro-mcp` spins up an SSE MCP server at `localhost:4321/__mcp/sse` during `astro dev` and auto-writes `.mcp.json` — giving Claude Code live access to `search-astro-docs`, `list-astro-routes`, and `get-astro-config` during development.

---

## 3. Migration Strategy (phased)

### Phase 1 — Project scaffold (day 1)
- Install Astro, `@astrojs/react`, `@astrojs/vercel`, `@astrojs/sitemap`, `astro-mcp`
- Install `@clerk/astro`
- Create `Base.astro`, `Public.astro`, `App.astro` layouts with Vercel design tokens
- Port `globals.css` with updated CSS variables
- Confirm Tailwind v4 works via PostCSS (no `@astrojs/tailwind` needed for v4)
- Confirm `@fontsource/geist-sans` and `@fontsource/geist-mono` load

### Phase 2 — Public/SEO pages (days 2–4)
- Port all marketing + content pages to `.astro` files
- These pages produce zero JavaScript — only HTML and CSS
- `getStaticPaths` replaces `generateStaticParams` for `/learn/[slug]` and `/questions-bank/[slug]`
- All metadata replaces Next.js `export const metadata` objects with `Base.astro` props
- `@astrojs/sitemap` replaces `src/app/sitemap.ts`
- `src/pages/robots.txt.ts` replaces `src/app/robots.ts`

### Phase 3 — API routes (days 3–5, parallel with Phase 2)
- Port all routes from `src/app/api/*/route.ts` to `src/pages/api/*.ts`
- Export pattern changes: `export function GET(context)` / `export function POST(context)` using Astro's `APIRoute` type
- `NextRequest` → `Request`, `NextResponse` → `Response` (standard web APIs, already compatible)
- All `src/lib/` server code reused unchanged
- Clerk server auth: `auth()` from `@clerk/nextjs/server` → `context.locals.auth()`

### Phase 4 — Authenticated app (days 5–9)
- Port each `/app/*` page to an `.astro` shell that loads a single React root with `client:load`
- Existing React component trees (Zustand, Dexie, Monaco, Framer Motion) work unchanged inside islands
- Clerk auth checked in middleware; `userId` passed to islands as props
- `client:only="react"` for Monaco Editor and Dexie (browser-only, cannot SSR)

---

## 4. Component Model

### Public page pattern (zero JS)
```astro
---
import { findTopicBySlug } from "@/lib/content/server-loader";
import Public from "@/layouts/Public.astro";

const { slug } = Astro.params;
const topic = findTopicBySlug(slug);
if (!topic) return Astro.redirect("/404");
---
<Public title={topic.name} description={topic.description}>
  <article>{topic.content}</article>
</Public>
```

### App page pattern (React island)
```astro
---
import App from "@/layouts/App.astro";
import DashboardApp from "@/components/app/dashboard/DashboardApp";

const { userId } = Astro.locals.auth();
if (!userId) return Astro.redirect("/login");
---
<App>
  <DashboardApp client:load userId={userId} />
</App>
```

### `client:*` directive rules
| Directive | Use case |
|---|---|
| `client:load` | All `/app/*` interactive pages |
| `client:visible` | Below-fold interactive elements on public pages |
| `client:only="react"` | Monaco Editor, Dexie (browser-only APIs) |

---

## 5. Auth (Clerk)

`@clerk/nextjs` → `@clerk/astro`. Middleware pattern is nearly identical:

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";

const isPublicRoute = createRouteMatcher([
  "/", "/learn/(.*)", "/questions-bank/(.*)",
  "/system-design-interview", "/backend-interview", "/database-interview",
  "/cloud-devops-interview", "/behavioral-interview", "/dsa-interview-questions",
  "/top-coding-questions", "/leetcode-alternative", "/contact", "/privacy",
  "/terms", "/login", "/sso-callback", "/ref/(.*)",
  "/api/contact", "/api/email-capture", "/api/og",
]);

export const onRequest = clerkMiddleware((auth, context) => {
  if (!isPublicRoute(context.request) && !auth().userId) {
    return auth().redirectToSignIn();
  }
});
```

**Key changes from `@clerk/nextjs`:**
- `useAuth()`, `useUser()` hooks work unchanged inside React islands
- Server-side: `auth()` from `@clerk/nextjs/server` → `Astro.locals.auth()` in `.astro` files; `context.locals.auth()` in API routes
- `<ClerkProvider>` wraps each React island tree (added to `App.astro` layout)

---

## 6. Visual Design

Vercel design system aesthetic executed with bold intentionality (per `frontend-design` skill).

### Design tokens (CSS variables in `globals.css`)
```css
:root {
  --color-bg: #0a0a0a;
  --color-surface: #111111;
  --color-border: #333333;
  --color-text: #ededed;
  --color-text-muted: #888888;
  --color-accent: #f59e0b;      /* amber — differentiates from Vercel's blue */
  --font-sans: "Geist Sans", sans-serif;
  --font-mono: "Geist Mono", monospace;
  --radius: 0px;                /* no border-radius on structural elements */
}

[data-theme="light"] {
  --color-bg: #ffffff;
  --color-surface: #fafafa;
  --color-border: #e5e5e5;
  --color-text: #0a0a0a;
  --color-text-muted: #666666;
}
```

### Design rules
- **Font:** Geist Sans (body/display) + Geist Mono (code) via `@fontsource`
- **Palette:** Near-black bg, off-white text, amber accent — monochrome with one pop of color
- **Mode:** Dark-first; light mode via `[data-theme="light"]` on `<html>`
- **Borders:** 1px solid `var(--color-border)`, zero border-radius on cards/panels
- **Motion:** Framer Motion for app pages (React islands); CSS `@keyframes` only on public pages (zero JS cost)
- **Layout:** 12-column grid, max-width 1200px, `clamp()`-based spacing

### What to avoid (per `frontend-design` skill)
- Inter, Roboto, Arial (replaced by Geist)
- Purple gradients on white backgrounds
- Generic rounded cards with drop shadows

---

## 7. Testing

- **Playwright e2e** (`e2e/`): existing tests updated for Astro URL patterns — no structural changes
- **Vitest unit tests** (`src/lib/**/*.test.ts`): run unchanged, test pure functions in `src/lib/`
- **Type checking:** `@astrojs/check` added alongside `tsc` for `.astro` files
- **Smoke test per phase:** `astro build && astro preview` confirms SSG output and no broken routes

---

## 8. Dependencies

### Add
```
astro
@astrojs/react
@astrojs/vercel
@astrojs/sitemap
@astrojs/check
astro-mcp
@clerk/astro
@fontsource/geist-sans
@fontsource/geist-mono
```

### Remove
```
next
@clerk/nextjs
eslint-config-next
next-themes
```

### Keep unchanged
All other dependencies (React 19, Tailwind v4, Zustand, Dexie, Framer Motion, Monaco, Supabase, Razorpay, Anthropic SDK, Resend, shadcn components, etc.)

---

## 9. Constraints & Risks

| Risk | Mitigation |
|---|---|
| Clerk `@clerk/astro` API surface differs from `@clerk/nextjs` | Audit server auth calls in all API routes during Phase 3 |
| `next/image` optimization → `astro:assets` `<Image>` | Mechanical swap; same `src`/`alt`/`width`/`height` props |
| OG image route uses `@vercel/og` | Port to Astro endpoint returning `ImageResponse` — same package works |
| Monaco Editor requires `client:only` (no SSR) | Already isolated in its own component; directive swap is one-line |
| `next-themes` removed | Implement dark/light toggle with `localStorage` + `data-theme` attribute in `Base.astro` — 20 lines |
| Landing page Framer Motion animations | Landing becomes zero-JS `.astro` file; animations rebuilt as CSS `@keyframes` or extracted to a minimal React island with `client:visible` |
