# Guru Sishya

**An interview-preparation platform built around how retention actually works** — structured topic ladders, active recall, and spaced repetition, not passive video watching.

Live at **[guru-sishya.in](https://www.guru-sishya.in)**.

## What it does

Pick a topic, and Guru Sishya builds you a complete learning loop for it:

- **Learning ladder** — the topic broken into ordered rungs, from fundamentals to interview-level depth
- **Study plan** — a schedule that fits the time you actually have
- **Quizzes** — active-recall questions with explanations, not just answers
- **Feynman drills** — explain the concept in your own words and get your explanation critiqued
- **Cheatsheets** — the compressed reference you review the night before
- **Spaced repetition** — topics resurface exactly when you're about to forget them
- **XP & leaderboard** — progress is measured, streaks are visible

## Design principles

- **Bring your own key.** AI features run on your own Anthropic API key, entered client-side. No accounts harvesting your usage.
- **Local-first.** Your progress and data live in your browser's storage, not on someone else's server.
- **Retention over consumption.** Every feature exists to move knowledge into long-term memory; nothing exists to maximize time-on-site.

## Stack

Next.js · TypeScript · client-side persistence · Anthropic API (user-supplied key)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

Built by [Kumar Gaurav](https://github.com/Gaurav1112). Actively developed — issues and suggestions welcome.
