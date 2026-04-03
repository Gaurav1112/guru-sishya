# Guru Sishya — Bug Tracker (2026-04-03)

## CRITICAL (Revenue Blockers)
1. **Razorpay not working** — 500 error, env vars not set on Vercel
2. **Questions visible to everyone** — should be gated for pro/non-pro
3. **Mitra AI attempts reset on refresh** — localStorage, should persist per user
4. **Pricing: no strikethrough pricing** — need ₹300→₹149, ₹1500→₹699 etc.

## HIGH (User Experience)
5. **Question navigation** — no way to go back to where user left off
6. **Java/Python compiler not working** — Judge0 CE issue, need alternative
7. **Code toggle in sessions** — Java+Python with toggle in topic sessions
8. **Demo tutorial for new users** — onboarding for all features
9. **Mitra gives wrong answers** — "kafka" returns "kafkaesque" instead of Apache Kafka
10. **Mock interview unanswered → revision** — not auto-adding to revision
11. **Question of the Day pattern** — all answers are B, need randomization

## MEDIUM (Profile/Badges)
12. **Profile estimated hours wrong** — incorrect calculations
13. **Badge logic not working** — first badge should be active
14. **LinkedIn share link missing** — from profile/badges

## TECHNICAL (SEO/Performance)
15. **Render blocking resources** — need to lazy load
16. **SPF records** — DNS configuration
17. **ads.txt missing** — need to add
18. **CDN not used** — Vercel serves from CDN by default, may need config
19. **20+ HTTP requests** — reduce page objects
20. **Google Analytics not detected** — GA env var may not be set
21. **Pricing timer** — countdown timer on pricing page
