# Guru Sishya — God-Level Product Audit & Action Plan

**Date:** 2026-03-28
**Current Scores:** Tech 9/10 | Content 8/10 | UX 7.5/10 | Retention 6.5/10 | Value Prop 4/10 | Business 3/10
**Target:** ALL 10/10

---

## Phase 1: Quick Wins (This Session — 2-4 hours)

### 1.1 Dynamic Sitemap for 138 Topics
- Modify `src/app/sitemap.ts` to generate entries for all topics
- +138 SEO pages, massive organic discovery boost

### 1.2 Outcome-Focused Landing Page Hero
- Change "Crack Your Software Engineering Interview" → "Ace FAANG Interviews in 8 Weeks"
- Add timeline: "138 topics, structured 8-week paths, mock interviews with boss rounds"
- Surface STAR behavioral prep + Mock Interview as hero features (currently hidden)

### 1.3 Simplify Dashboard
- Collapse sections by default (show 4 key: Welcome, Progress, Daily Goal, Quick Start)
- Add "Getting Started" guidance for new users

### 1.4 Root Error Boundary
- Add `src/app/error.tsx` for landing page errors

### 1.5 Fix window.location.href → useRouter
- Replace 5 instances with Next.js router

---

## Phase 2: Business Model Fix (1 week)

### 2.1 Tighten Free Tier
- Free: 5 quiz questions/topic/day (not unlimited)
- Free: DSA topics only (System Design + Behavioral = Pro)
- Free: Quick Saar preview (first 30%, full = Pro)
- Free: Basic Vidya Levels (level 1-2 only, 3-5 = Pro)
- Keep: All topic browsing, session reading, offline access

### 2.2 Make Pro Essential
- Pro: Full quiz bank (unlimited)
- Pro: System Design + Behavioral content
- Pro: Full Quick Saar + Vidya Levels
- Pro: Guru Mode (AI teach-back)
- Pro: Mock Interview (boss rounds)
- Pro: Analytics dashboard (weak areas, radar chart)
- Pro: Completion certificates

### 2.3 Price Adjustment
- Monthly: ₹299 (from ₹149) — position as "accelerator"
- Semester: ₹999 (6 months)
- Annual: ₹1,499 (best value)
- Lifetime: ₹4,999

---

## Phase 3: Content God-Level (2-3 weeks)

### 3.1 System Design Case Studies (8-10)
- Design YouTube, Instagram, Uber, Airbnb, WhatsApp, Twitter, Spotify, Stripe
- Each: back-of-envelope, schema, API, sharding, caching, real metrics

### 3.2 Missing DSA Topics (3)
- Bit Manipulation (6-8 sessions)
- Trie (5 sessions)
- Union-Find (4-5 sessions)

### 3.3 Adversarial Interview Scenarios
- Add "What if..." follow-up questions to every topic
- Real failure scenarios, trade-off discussions

### 3.4 Problem-to-Solution Mapping
- Link concepts → specific LeetCode problems → real-world systems

---

## Phase 4: Growth & Retention (2-3 weeks)

### 4.1 Company-Specific Prep Paths
- "Prepare for Google in 6 weeks" — structured path with progress
- "Prepare for Amazon in 4 weeks" — behavioral + system design focus
- Interview countdown timer

### 4.2 Push Notifications
- Streak-at-risk (day 2 of gap)
- Daily challenge available (6 AM)
- Comeback nudge (day 3, 5, 7)

### 4.3 Referral System
- Invite 3 friends = 1 month free
- Referrer gets ₹100 credit

### 4.4 Social Sharing
- Share streak, badges, quiz scores to LinkedIn/Twitter/WhatsApp
- Shareable challenge links

### 4.5 Renewal Emails
- "Your Pro expires in 3 days"
- Auto-renewal toggle

### 4.6 Weekly Progress Digest
- Email: "You improved 23% this week. Weak area: DP"

---

## Phase 5: UX Polish (1-2 weeks)

### 5.1 Onboarding Tour
- 30-second interactive tour for first-time users
- Highlight: Quiz, Flashcards, Progress, Leaderboard

### 5.2 Topic Hub Guidance
- Number feature cards: 1→2→3→4→5→6
- "Start here" arrow on Guru's Path

### 5.3 Quiz Pause/Resume
- Save state to Dexie after each answer
- "Resume Quiz" button on topic hub

### 5.4 Contextual Tooltips
- Explain XP, streaks, coins, badges on hover
- "What's a Vidya Level?" help icons

### 5.5 Streak Freeze UX
- Show freeze count in topbar
- One-click "Use Freeze?" when at risk
- Milestone reminders

---

## Phase 6: Technical Excellence (1 week)

### 6.1 Redis Rate Limiting (Upstash)
### 6.2 Server-Side Feature Gates
### 6.3 ESLint exhaustive-deps
### 6.4 Completion Certificates (PDF generation)
### 6.5 Blog/Learn Routes for SEO
