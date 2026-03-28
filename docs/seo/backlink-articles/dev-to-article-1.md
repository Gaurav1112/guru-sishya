---
title: "I Built a Free LeetCode Alternative for Indian Engineers (138 Topics, 1900+ Questions)"
published: false
description: "Why I spent 6 months building a completely free interview prep platform with system design, DSA, Java, and behavioral prep — all without a subscription paywall."
tags: webdev, interview, opensource, career
canonical_url: https://www.guru-sishya.in
cover_image: <!-- TODO: Add screenshot of dashboard showing topic grid -->
---

## The Problem That Wouldn't Let Me Sleep

Last year, a friend of mine — a sharp developer with 3 years of experience at a Bangalore startup — bombed his Amazon interview. Not because he couldn't code. He could. But he'd spent two months on LeetCode Premium ($35/month, roughly Rs. 2,900) grinding random problems without a structured plan. He knew how to reverse a linked list but froze when the interviewer asked him to design a URL shortener.

That conversation haunted me. Because his story isn't unique — it's the default experience for millions of Indian engineers preparing for FAANG and product-based company interviews.

The interview prep industry has a dirty secret: **it's designed to keep you subscribed, not to get you hired.**

So I built something different.

## What I Built

[Guru-Sishya](https://www.guru-sishya.in) is a free, no-login interview preparation platform built specifically for software engineers. It covers everything you need — DSA, system design, Java/Spring Boot, JavaScript/React, behavioral interviews, design patterns, databases, DevOps, and more — in one place.

Here's the scope:

- **138 topics** across 19 categories
- **1,933 quiz questions** with detailed explanations
- **671 structured study sessions** with Java + Python code examples
- **52 cheatsheets** (printable, with code in both Java and Python)
- **263 Mermaid diagrams** for visual learners
- **33 achievement badges** and a full gamification system
- **An interactive code playground** (JS, Python, Java, C, C++)
- **Behavioral interview prep** with STAR framework stories

And it costs exactly Rs. 0 for the core experience. No credit card. No "free trial that expires." No login wall.

<!-- TODO: Screenshot — Landing page hero section showing the tagline and topic count -->

## Why "Yet Another" Interview Platform?

Fair question. Here's what frustrated me about existing options:

### LeetCode
Great problem database, but zero guidance on *what to study when*. The editorial quality varies wildly. System design? Barely covered. Behavioral? Nonexistent. And the pricing — $35/month or $159/year — is steep when you're between jobs.

### InterviewBit
Started strong, then pivoted to Scaler Academy (Rs. 3-4 lakhs for their course). The free tier became an afterthought.

### Neetcode
Excellent curated lists, but it's still just a list. No integrated learning sessions, no quizzes, no progress tracking beyond checking off problems.

### Paid Courses (Striver, Apna College, etc.)
Solid content creators, but their courses are video-heavy. If you're a working professional with 2 hours a day, you can't afford to watch 45-minute videos when you need a quick refresher on Dijkstra's algorithm.

**What was missing was a single platform that combines structured learning, practice, and review — without requiring you to juggle 5 tabs and 3 subscriptions.**

That's exactly what [Guru-Sishya](https://www.guru-sishya.in) does.

## How It's Different

### 1. Study Plans, Not Random Problems

Every topic has structured sessions. When you open "Binary Trees" on Guru-Sishya, you don't get a wall of 50 problems. You get a learning path:

1. Concept explanation with diagrams
2. Code examples in Java AND Python
3. Practice questions with increasing difficulty
4. A cheatsheet for quick revision
5. A quiz to test retention

<!-- TODO: Screenshot — Topic hub page for "Binary Trees" showing sessions, quiz, and cheatsheet tabs -->

### 2. System Design Is a First-Class Citizen

Most free platforms treat system design as an afterthought. On Guru-Sishya, it's a core pillar with:

- **Fundamentals**: Load balancing, caching, database sharding, CAP theorem
- **Case studies**: Design WhatsApp, Design Netflix, Design a Payment System
- **Estimation problems**: "How many requests does YouTube handle per second?"

Each case study includes architecture diagrams (rendered as Mermaid diagrams, not static images) so you can actually understand the flow.

Check out the system design section at [guru-sishya.in/app/topics](https://www.guru-sishya.in/app/topics).

### 3. Behavioral Prep That Actually Prepares You

I've seen engineers ace 5 rounds of technical interviews and get rejected because they couldn't articulate a time they dealt with conflict. Guru-Sishya includes:

- STAR framework templates
- 50+ behavioral question-answer pairs
- Stories categorized by competency (leadership, failure, teamwork, etc.)

### 4. Code Playground Built In

No switching to a separate IDE. The integrated playground supports JavaScript, TypeScript, Python (via Pyodide — runs in your browser), and Java/C/C++ (via Judge0). You can test code snippets right alongside the lesson content.

### 5. Gamification That Actually Works

Learning is hard. Consistency is harder. Guru-Sishya uses:

- **XP and levels**: Progress from "Shishya" (student) to "Maharishi" (master)
- **Streaks**: Daily streaks with comeback mechanics so one missed day doesn't destroy your motivation
- **33 badges**: Earned for milestones like completing all DSA topics or scoring 100% on a quiz
- **A leaderboard**: Because a little competition helps

<!-- TODO: Screenshot — Profile page showing badges, XP, and current level -->

## The Tech Stack (For Fellow Devs)

Since this is Dev.to, you probably want the technical details:

- **Next.js 15** with App Router
- **Tailwind CSS** + **shadcn/ui** for the component library
- **Static JSON content** — all 671 sessions are pre-generated, so there's zero API latency
- **Pyodide** for in-browser Python execution
- **Judge0 CE** for Java/C/C++ compilation
- **Zustand** for state management
- **IndexedDB** (via Dexie) for client-side progress persistence
- **Razorpay** for optional premium features

The key architectural decision was making everything static. The content is pre-generated JSON files served from `/public/content/`. This means:

- **No server costs** for content delivery (Vercel edge caching handles it)
- **Instant page loads** — no waiting for a database query
- **Works offline** once cached
- **Zero API dependency** for core features

## What I Learned Building This

### Content is 10x harder than code

I spent maybe 30% of the time on the Next.js app and 70% on content — writing sessions, generating quiz questions, creating diagrams, adding code examples in two languages. If you're building an educational platform, budget your time accordingly.

### Gamification is not optional

Early versions had no XP, no badges, no streaks. Usage dropped off a cliff after day 3. Adding gamification doubled 7-day retention. Humans are predictable creatures.

### Indian engineers want depth, not breadth

My analytics showed that the most popular topics aren't the flashy ones. They're the deep dives: Spring Boot internals, Java concurrency, database indexing. Indian product companies (and FAANG India offices) go deep in interviews. The platform reflects that.

### Free doesn't mean low quality

There's a misconception that free content must be inferior. The 1,933 quiz questions on Guru-Sishya have detailed explanations with formatted paragraphs, bold verdicts, and code snippets. Every session has objectives, activities, and review questions. Free just means I chose not to lock essential learning behind a paywall.

## The Road Ahead

The platform is live and actively maintained. Here's what's coming:

- **YouTube video embeds** per session for visual learners
- **Progress analytics dashboard** with weak-area detection
- **Company-specific prep paths** ("Prepare for Google in 6 weeks")
- **Completion certificates** for LinkedIn
- **More topics**: Kafka deep dive, Kubernetes patterns, ML system design

## Try It

If you're preparing for interviews — or know someone who is — give [Guru-Sishya](https://www.guru-sishya.in) a try. No signup required for core features. No "freemium" bait-and-switch.

And if you have feedback, I'd genuinely love to hear it. Drop a comment below or reach out — building this in public means every piece of feedback makes the platform better.

---

*Guru-Sishya (literally "Teacher-Student" in Sanskrit) is built on the idea that quality education shouldn't have a price tag. The core platform — 138 topics, 1900+ questions, 671 sessions — is and will remain free.*
