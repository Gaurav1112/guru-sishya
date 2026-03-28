#!/usr/bin/env node
/**
 * generate-star-stories.js
 *
 * Generates 50 STAR behavioral interview stories across 8 categories.
 * Output: public/content/star-stories.json
 *
 * Categories (50 total):
 *   Conflict Resolution (8), Leadership & Ownership (8),
 *   Customer Obsession (6), Innovation & Problem Solving (6),
 *   Failure & Learning (6), Teamwork & Collaboration (6),
 *   Time Management & Prioritization (5), Technical Decision Making (5)
 */

const fs = require("fs");
const path = require("path");

const stories = [
  // ═══════════════════════════════════════════════════════════════
  // CONFLICT RESOLUTION (8 stories)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 1,
    question: "Tell me about a time you had to deal with a difficult team member.",
    category: "Conflict Resolution",
    companies: ["Amazon", "Google", "Meta"],
    leadershipPrinciple: "Earn Trust",
    seniority: "SDE-2",
    star: {
      situation:
        "During our Q3 sprint at a mid-size fintech startup, a senior backend engineer consistently blocked code reviews for the payments team. He rejected 14 PRs in two weeks citing style nitpicks, causing our Stripe migration to fall 8 days behind schedule. Team morale dropped and two junior engineers asked to transfer.",
      task:
        "As the tech lead of the payments squad, I needed to unblock the migration without alienating the senior engineer, who had deep institutional knowledge of our billing system.",
      action:
        "I scheduled a private 1:1 over coffee, not in a meeting room. I opened by acknowledging his expertise and asked what his ideal code quality bar looked like. He revealed he felt excluded from the architecture decision to move to Stripe. I proposed he lead the error-handling design for the new integration and co-author our internal style guide. I also set up a 24-hour SLA for code reviews with the team.",
      result:
        "The senior engineer became the strongest advocate for the migration. Review turnaround dropped from 4.2 days to 0.8 days. We delivered the Stripe migration 2 days ahead of the revised deadline, processing $2.3M in the first week with zero payment failures."
    },
    tips: [
      "Always start with empathy — understand the root cause before proposing solutions",
      "Quantify the impact: review delays, schedule slippage, team morale metrics",
      "Show that your solution was inclusive, not punitive"
    ],
    followUps: [
      "What would you have done if the engineer refused to cooperate?",
      "How did you measure whether the relationship actually improved?",
      "Would you handle this differently if you were not the tech lead?"
    ]
  },
  {
    id: 2,
    question: "Describe a situation where two teams had conflicting priorities.",
    category: "Conflict Resolution",
    companies: ["Amazon", "Microsoft", "Apple"],
    leadershipPrinciple: "Have Backbone; Disagree and Commit",
    seniority: "Senior",
    star: {
      situation:
        "At a Series C e-commerce company, the Platform team wanted to freeze all deployments for 3 weeks to migrate from EC2 to EKS, while the Product team had a Black Friday feature launch that required 12 deployments in that window. Both teams escalated to the VP of Engineering.",
      task:
        "As the Staff Engineer bridging both teams, I was asked to propose a resolution that satisfied both the reliability migration and the revenue-critical launch.",
      action:
        "I mapped dependencies and found that only 3 of the 12 product deployments touched infrastructure the migration would affect. I proposed a phased approach: migrate non-critical services in week 1, freeze only the 3 conflicting deployments to week 2 with a parallel staging environment, and complete remaining migrations in week 3. I created a shared Jira board with both teams and ran daily 10-minute syncs.",
      result:
        "Both initiatives completed on schedule. Black Friday revenue hit $4.7M (18% above target). The EKS migration reduced infrastructure costs by 31% ($128K/year). The VP cited this as a model for cross-team planning and we formalized the phased-migration playbook."
    },
    tips: [
      "Frame it as finding a creative third option, not picking a side",
      "Use data to de-escalate: map actual dependencies vs. assumed ones",
      "Highlight the organizational process improvement that resulted"
    ],
    followUps: [
      "What if the phased approach had not been technically feasible?",
      "How did you handle pushback from either team?",
      "What would you do differently if you had less organizational authority?"
    ]
  },
  {
    id: 3,
    question: "Tell me about a time you received harsh feedback from a peer.",
    category: "Conflict Resolution",
    companies: ["Google", "Meta", "Netflix"],
    leadershipPrinciple: "Earn Trust",
    seniority: "Fresh Grad",
    star: {
      situation:
        "Three months into my first job at a SaaS startup, a senior engineer publicly called out my API design in a team Slack channel, saying it was 'the worst REST API I have seen in 5 years' with specific criticisms of my pagination approach and error codes.",
      task:
        "I needed to respond professionally, learn from valid criticism, and maintain my credibility as a new team member without letting the public nature of the feedback derail me.",
      action:
        "I took 30 minutes before responding. I thanked him publicly for the detailed feedback and said I would review each point. Privately, I asked him to walk me through his preferred patterns. He spent 45 minutes showing me cursor-based pagination and RFC 7807 error responses. I refactored the API, wrote up a comparison doc of both approaches, and shared it with the team as a learning resource.",
      result:
        "The refactored API reduced p99 list endpoint latency from 320ms to 85ms. The comparison doc became our team's API design reference. The senior engineer became my informal mentor and recommended me for the API platform team 6 months later. My manager noted my maturity in handling the situation in my first performance review."
    },
    tips: [
      "Never respond emotionally in the moment — take a pause",
      "Separate the delivery from the content: focus on what was valid",
      "Show growth by turning criticism into a team resource"
    ],
    followUps: [
      "Did you ever address the public nature of the criticism with him?",
      "How would you handle it if the feedback was wrong?",
      "What did you learn about giving feedback from this experience?"
    ]
  },
  {
    id: 4,
    question: "Describe a time when you disagreed with your manager's technical decision.",
    category: "Conflict Resolution",
    companies: ["Amazon", "Google", "Apple"],
    leadershipPrinciple: "Have Backbone; Disagree and Commit",
    seniority: "SDE-2",
    star: {
      situation:
        "My engineering manager at a healthcare SaaS company decided to rewrite our patient records service from Python/Django to Go, estimating 6 weeks. Based on my analysis of the codebase (47K lines, 280+ integration tests, HIPAA compliance requirements), I believed it would take at least 16 weeks and risk compliance gaps.",
      task:
        "I needed to present my concerns with data, not just gut feeling, while respecting my manager's authority and the team's excitement about Go.",
      action:
        "I spent a weekend building a migration complexity scorecard: I categorized every Django middleware, ORM query, and compliance check that needed Go equivalents. I identified 23 Django-specific patterns with no direct Go library equivalent. I presented this to my manager in a private 1:1 with three options: full rewrite (16 weeks), strangler fig pattern (8 weeks for critical paths), or performance-optimize the existing Django code (3 weeks). I recommended option 2.",
      result:
        "My manager chose the strangler fig approach. We migrated the 4 highest-traffic endpoints to Go (reducing p99 from 890ms to 120ms) while keeping HIPAA-sensitive operations in Django. Total timeline was 9 weeks. We passed our SOC2 audit without findings. My manager thanked me publicly for 'saving us from a 4-month detour' at the next all-hands."
    },
    tips: [
      "Always bring data and alternatives, never just 'I disagree'",
      "Present options with trade-offs so the manager still makes the final call",
      "Emphasize shared goals: reliability, compliance, speed"
    ],
    followUps: [
      "What if your manager had insisted on the full rewrite?",
      "How did the team react to the compromise approach?",
      "Would you disagree publicly if the manager dismissed your 1:1 concerns?"
    ]
  },
  {
    id: 5,
    question: "Tell me about a conflict between engineering and product teams.",
    category: "Conflict Resolution",
    companies: ["Meta", "Google", "Microsoft"],
    leadershipPrinciple: "Customer Obsession",
    seniority: "Senior",
    star: {
      situation:
        "At a B2B analytics platform, the Product team pushed to launch a real-time dashboard feature in 4 weeks to close a $1.2M enterprise deal. Engineering estimated 10 weeks minimum because our data pipeline was batch-only (6-hour refresh cycles). The Head of Product escalated, claiming engineering was 'sandbagging.'",
      task:
        "As the engineering lead, I needed to find a path that satisfied the customer requirement without committing to an unrealistic timeline that would result in a buggy, unmaintainable feature.",
      action:
        "I invited the Product lead and the enterprise customer's technical lead to a joint session. We discovered the customer needed 'near real-time' for 3 specific metrics, not the entire dashboard. I proposed a hybrid: we would add a Kafka stream for those 3 metrics (4-week effort) and keep batch processing for the remaining 40+ metrics. I created a shared technical design doc both teams approved.",
      result:
        "We delivered the hybrid solution in 3.5 weeks. The enterprise customer signed the $1.2M annual contract. The streaming pipeline later became the foundation for our real-time product tier, generating an additional $3.8M ARR over the next year. Product and engineering adopted joint design sessions as a standard practice."
    },
    tips: [
      "Involve the actual customer to uncover the real requirement vs. assumed scope",
      "Frame engineering estimates as enabling better product decisions, not blocking them",
      "Quantify both the business value and the technical debt risk"
    ],
    followUps: [
      "How would you handle it if the customer really needed full real-time?",
      "What if the Product lead continued to push for the original 4-week timeline?",
      "How did you prevent this type of conflict from recurring?"
    ]
  },
  {
    id: 6,
    question: "Describe a time you had to mediate between two engineers who could not agree.",
    category: "Conflict Resolution",
    companies: ["Google", "Amazon", "Netflix"],
    leadershipPrinciple: "Earn Trust",
    seniority: "SDE-2",
    star: {
      situation:
        "Two senior engineers on my team spent 3 weeks debating whether to use GraphQL or REST for our new mobile API at an edtech startup. Each wrote 5-page design docs arguing their position. Standups became tense, and two PRs sat unreviewed because each engineer refused to review the other's code.",
      task:
        "As the team lead, I needed to break the deadlock, make a technical decision, and repair the working relationship between two critical team members before it affected the broader team.",
      action:
        "I set up a structured 'decision framework' session: each engineer got 15 minutes to present their strongest 3 arguments with data. I then listed objective criteria (mobile app latency, client caching, schema evolution, team familiarity) and had each person score both options. I also brought in real mobile performance benchmarks from our analytics. Finally, I proposed a time-boxed proof-of-concept: 2 days each, measured against the same 5 API endpoints.",
      result:
        "The PoC showed REST with partial responses outperformed GraphQL for our specific use case (42ms vs. 67ms p50 on 3G). Both engineers agreed on the data. I paired them on the implementation, and they co-authored a blog post about the evaluation. Our mobile API launched 2 weeks later with 99.7% uptime in the first month."
    },
    tips: [
      "Use objective criteria and data to defuse opinion-based arguments",
      "Time-boxed PoCs are powerful — they shift the debate from theory to evidence",
      "Pairing the disagreeing parties on implementation builds mutual respect"
    ],
    followUps: [
      "What if the PoC results were inconclusive?",
      "How did you handle the unreviewed PRs in the meantime?",
      "What if one engineer refused to accept the PoC results?"
    ]
  },
  {
    id: 7,
    question: "Tell me about a time you had to push back on a stakeholder's request.",
    category: "Conflict Resolution",
    companies: ["Amazon", "Apple", "Microsoft"],
    leadershipPrinciple: "Have Backbone; Disagree and Commit",
    seniority: "Senior",
    star: {
      situation:
        "The VP of Sales at our enterprise SaaS company demanded we build a custom single-tenant deployment for a $500K prospect within 2 weeks. Our multi-tenant architecture had no isolation capabilities, and rushing this would mean bypassing our security review process, which was a SOC2 requirement.",
      task:
        "I needed to protect engineering integrity and compliance while not dismissing a significant business opportunity. Simply saying 'no' would damage the engineering-sales relationship.",
      action:
        "I prepared a one-pager showing three paths: (1) custom deployment in 2 weeks with SOC2 risk and $200K estimated remediation cost, (2) namespace-based isolation in 6 weeks that would serve this and future enterprise clients, (3) a sandboxed demo environment in 1 week that would satisfy the prospect's security evaluation. I presented to the VP of Sales and CTO together, with a risk matrix for each option.",
      result:
        "We went with option 3 for immediate needs and option 2 as the long-term solution. The prospect signed after the demo environment passed their security review. The namespace isolation we built attracted 4 more enterprise clients ($2.1M combined ARR). The VP of Sales became an advocate for involving engineering earlier in enterprise deals."
    },
    tips: [
      "Never just say 'no' — always present alternatives with clear trade-offs",
      "Include the cost of the 'fast' option to make the risk tangible",
      "Bring both the business stakeholder and a technical executive to the table"
    ],
    followUps: [
      "What if the VP insisted on the 2-week option?",
      "How did you balance the demo environment work with your existing sprint?",
      "What process changes did you implement to prevent similar last-minute requests?"
    ]
  },
  {
    id: 8,
    question: "Describe a time you had to resolve a disagreement about code quality standards.",
    category: "Conflict Resolution",
    companies: ["Google", "Meta", "Netflix"],
    leadershipPrinciple: "Insist on the Highest Standards",
    seniority: "SDE-2",
    star: {
      situation:
        "After our team at a logistics startup grew from 4 to 12 engineers in 6 months, code review standards became wildly inconsistent. Some reviewers demanded 90%+ test coverage, others approved PRs with zero tests. Two new hires complained that reviews felt arbitrary, and our bug escape rate doubled from 3% to 6.2%.",
      task:
        "I volunteered to lead the effort to standardize our code review process without making it feel bureaucratic or slowing down our deployment velocity of 8 deploys per day.",
      action:
        "I analyzed 200 past code reviews and categorized rejection reasons into 5 buckets. I drafted a one-page 'Review Contract' with the team covering: mandatory (security, error handling, test for behavior changes) vs. optional (style, naming) feedback. I integrated automated checks for the mechanical items (linting, coverage thresholds at 70%) and set up 'review buddies' pairing senior and junior engineers. We trialed for 2 weeks and iterated based on team retro feedback.",
      result:
        "Bug escape rate dropped from 6.2% to 1.8% in 8 weeks. Average review time decreased from 2.1 days to 0.6 days. New hire onboarding surveys showed a 40-point NPS increase for the code review experience. The Review Contract was adopted by 3 other teams in the company."
    },
    tips: [
      "Use data from past reviews to make the case — it removes subjectivity",
      "Separate mechanical checks (automate them) from judgment calls (guide them)",
      "Trial periods with feedback loops show you value the team's input"
    ],
    followUps: [
      "How did you handle pushback from engineers who liked the old flexibility?",
      "What was the hardest part of the Review Contract to get agreement on?",
      "How do you maintain the standard as the team continues to grow?"
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // LEADERSHIP & OWNERSHIP (8 stories)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 9,
    question: "Tell me about a time you took ownership of something outside your role.",
    category: "Leadership & Ownership",
    companies: ["Amazon", "Google", "Meta"],
    leadershipPrinciple: "Ownership",
    seniority: "SDE-2",
    star: {
      situation:
        "Our on-call rotation at a ride-sharing startup had a recurring 3 AM alert for a memory leak in the notification service. It was owned by another team, but they had deprioritized it for 4 months. Our team was downstream and lost 2 hours of sleep per week responding to cascading failures.",
      task:
        "No one asked me to fix another team's service, but I decided to take ownership because the problem was hurting our on-call engineers' well-being and our service's reliability.",
      action:
        "I spent 3 evenings profiling the notification service with async-profiler and identified the leak: an unbounded cache of user device tokens that grew 800MB per day. I wrote a fix (LRU cache with 50K entry cap and 1-hour TTL), created a PR on their repo with a detailed analysis, offered to pair on testing, and presented the findings to their tech lead.",
      result:
        "The fix was merged within 2 days. The 3 AM alerts stopped entirely. Memory usage dropped from 4.2GB to 600MB. Our team's on-call incident rate decreased by 35%. The other team's manager sent a thank-you to my skip-level, and the fix approach was added to our company's memory leak debugging runbook."
    },
    tips: [
      "Show initiative by fixing cross-team problems, not just flagging them",
      "Always do the work first, then present the solution — it removes friction",
      "Quantify the human impact (sleep, on-call burden) alongside technical metrics"
    ],
    followUps: [
      "How did you balance this with your own team's priorities?",
      "What if the other team had rejected your PR?",
      "How do you decide when to take ownership vs. escalate?"
    ]
  },
  {
    id: 10,
    question: "Describe a time you led a project without formal authority.",
    category: "Leadership & Ownership",
    companies: ["Google", "Amazon", "Microsoft"],
    leadershipPrinciple: "Bias for Action",
    seniority: "Fresh Grad",
    star: {
      situation:
        "Six months into my role at a cloud infrastructure company, I noticed our internal developer portal had a 45-second page load time and 12% daily error rate. Engineers complained in Slack weekly but no one owned the portal — it was an orphaned project from a departed team.",
      task:
        "I wanted to fix the developer portal to improve productivity for 200+ engineers, even though I had no authority, no budget, and it was not part of any team's OKRs.",
      action:
        "I wrote a one-page proposal quantifying the problem: 200 engineers x 3 visits/day x 45 seconds = 75 hours/week of waiting. I shared it in the engineering-wide Slack and asked for volunteers. Five engineers from different teams joined for '20% time' contributions. I organized weekly 30-minute syncs, created a kanban board, and tackled the biggest wins first: added Redis caching, fixed N+1 queries, and migrated from a single Heroku dyno to two.",
      result:
        "Page load dropped from 45 seconds to 1.8 seconds. Error rate went from 12% to 0.3%. The VP of Engineering featured it in the quarterly all-hands. The portal got assigned a dedicated half-time engineer. I was promoted to SDE-2 in the next cycle, with this project cited as a key factor."
    },
    tips: [
      "Quantify the cost of inaction to build urgency",
      "Start with volunteers and quick wins to build momentum",
      "Document and share progress publicly to maintain support"
    ],
    followUps: [
      "How did you motivate volunteers who had their own team commitments?",
      "What if no one had volunteered?",
      "How did you prioritize which issues to fix first?"
    ]
  },
  {
    id: 11,
    question: "Tell me about a time you had to make a critical decision with incomplete information.",
    category: "Leadership & Ownership",
    companies: ["Amazon", "Netflix", "Meta"],
    leadershipPrinciple: "Bias for Action",
    seniority: "Senior",
    star: {
      situation:
        "During a production incident at a payments company, our transaction processing rate dropped 70% at 2 PM on a Friday. Monitoring showed database CPU at 98%, but we could not determine the root cause. The database team was at an offsite, unreachable. We were losing approximately $18K per hour in failed transactions.",
      task:
        "As the senior engineer on call, I had to decide between three risky options with no database expert available: vertically scale the DB (15 minutes, expensive), failover to the read replica (5 minutes, risk of data inconsistency), or kill suspicious queries (immediate, risk of breaking dependent services).",
      action:
        "I ran a quick pg_stat_activity query and identified 340 long-running analytical queries from a newly deployed reporting feature — they were doing full table scans on the transactions table (890M rows). I killed those queries immediately (option 3), added a connection pool limit for the reporting service, and deployed a hotfix to route analytical queries to the read replica. I documented every action in the incident channel in real-time.",
      result:
        "Transaction processing recovered to 100% within 3 minutes of killing the queries. Total revenue impact was $27K (1.5 hours). The read replica routing became permanent architecture. I wrote the post-mortem on Monday, which led to query governance policies: all new queries on tables over 100M rows now require EXPLAIN ANALYZE review before deployment."
    },
    tips: [
      "Show your decision-making framework under pressure, not just the outcome",
      "Document actions in real-time — it shows leadership and helps post-mortems",
      "Always turn incidents into process improvements"
    ],
    followUps: [
      "What if killing the queries had not resolved the issue?",
      "How do you decide how much information is 'enough' to act?",
      "How did you communicate the incident to non-technical stakeholders?"
    ]
  },
  {
    id: 12,
    question: "Describe a time you mentored someone and it made a significant impact.",
    category: "Leadership & Ownership",
    companies: ["Google", "Microsoft", "Amazon"],
    leadershipPrinciple: "Develop the Best",
    seniority: "Senior",
    star: {
      situation:
        "A junior engineer on my team at an adtech company was consistently delivering late and her code had a 40% first-review rejection rate. She was on a performance improvement plan and considering leaving the industry. Her manager asked if I could help as a technical mentor.",
      task:
        "I needed to identify the root causes of her struggles and create a structured improvement plan within the 60-day PIP window.",
      action:
        "In our first session I discovered she had gaps in system design thinking — she dove into code without planning. I set up bi-weekly 1:1 pairing sessions where we worked through problems together: first 20 minutes whiteboarding, then implementation. I introduced her to design docs (she had never written one) and reviewed her first three before submission. I also connected her with a senior woman engineer in another team for broader career mentoring.",
      result:
        "Within 45 days, her first-review approval rate went from 60% to 91%. She completed her PIP successfully. Six months later, she designed and shipped our new bid optimization pipeline independently, reducing CPA by 23% ($340K annual savings). She was promoted to SDE-2 the following cycle and now mentors new hires herself."
    },
    tips: [
      "Diagnose the root cause — late delivery often signals upstream planning gaps, not laziness",
      "Structured mentoring (scheduled, specific goals) works better than ad-hoc advice",
      "Share the long-term outcome: promotions, independence, paying it forward"
    ],
    followUps: [
      "How did you balance mentoring with your own deliverables?",
      "What would you have done if she did not improve?",
      "How do you adapt your mentoring style for different people?"
    ]
  },
  {
    id: 13,
    question: "Tell me about a time you drove adoption of a new technology or practice.",
    category: "Leadership & Ownership",
    companies: ["Netflix", "Google", "Meta"],
    leadershipPrinciple: "Invent and Simplify",
    seniority: "SDE-2",
    star: {
      situation:
        "Our e-commerce platform's test suite took 47 minutes to run on CI, and engineers had stopped running tests locally. The pass rate on the main branch was 82%, meaning 1 in 5 merges broke something. The team had 'accepted' this as normal for a 3-year-old codebase.",
      task:
        "I wanted to introduce parallel test execution and test impact analysis to bring CI under 10 minutes and make testing a positive experience rather than a bottleneck.",
      action:
        "I spent a sprint building a proof of concept: I integrated Jest's shard mode with our CI (splitting tests across 8 workers), added test impact analysis using git diff to only run tests affected by changed files, and created a Slack bot that posted test results with timing breakdowns. To drive adoption, I presented results at our engineering brown bag, wrote a migration guide, and offered to pair with each team for their first migration.",
      result:
        "CI time dropped from 47 minutes to 6.5 minutes. Main branch pass rate climbed from 82% to 98.4% in 6 weeks. Engineers started running tests locally again (measured via pre-commit hook telemetry: from 12% to 78% of commits). Four other teams adopted the setup. I was asked to present at our internal tech conference."
    },
    tips: [
      "Build the proof of concept first — demos sell better than proposals",
      "Make adoption easy: guides, pairing sessions, and tooling (Slack bots)",
      "Measure before/after with multiple metrics to show comprehensive impact"
    ],
    followUps: [
      "How did you handle teams that were resistant to changing their test setup?",
      "What trade-offs did test impact analysis introduce?",
      "How do you maintain the system as the codebase evolves?"
    ]
  },
  {
    id: 14,
    question: "Describe a time you had to build consensus for an unpopular decision.",
    category: "Leadership & Ownership",
    companies: ["Amazon", "Apple", "Microsoft"],
    leadershipPrinciple: "Have Backbone; Disagree and Commit",
    seniority: "Senior",
    star: {
      situation:
        "At a media streaming company, I proposed deprecating our custom-built CDN caching layer (18 months of work by the platform team) in favor of Cloudflare Workers. The platform team was understandably defensive — they had built the system and it worked. But it required 2 engineers for maintenance and could not scale to our new Asian markets.",
      task:
        "I needed to convince the platform team and engineering leadership that replacing their work was the right business decision, without damaging morale or relationships.",
      action:
        "I invited the platform team lead to co-run the evaluation. We defined 7 objective criteria together (latency, cost, maintainability, global coverage, team allocation, reliability, migration effort). We scored both systems honestly — our custom solution won on 2 criteria (customization, institutional knowledge). I acknowledged those wins publicly. I proposed that the platform engineers lead the Cloudflare migration, positioning them as the experts, and that we open-source the custom CDN layer as a company contribution.",
      result:
        "The team voted 7-2 to proceed with migration. CDN costs dropped 42% ($89K/year). Asian market latency improved from 340ms to 45ms. The two platform engineers became our edge computing experts. The open-source release got 1.2K GitHub stars and became a recruiting asset."
    },
    tips: [
      "Include the 'losing' side in the evaluation — it makes the process feel fair",
      "Acknowledge what works well about the current system publicly",
      "Reposition affected engineers as leaders of the new solution, not victims of the change"
    ],
    followUps: [
      "How did you handle the two engineers who voted against the migration?",
      "What would you do if the evaluation showed the custom solution was better?",
      "How long did the migration take, and what surprises came up?"
    ]
  },
  {
    id: 15,
    question: "Tell me about a time you took responsibility for a mistake.",
    category: "Leadership & Ownership",
    companies: ["Amazon", "Google", "Netflix"],
    leadershipPrinciple: "Ownership",
    seniority: "Fresh Grad",
    star: {
      situation:
        "In my second month at a healthtech startup, I deployed a database migration to production that dropped a column still referenced by the billing service. I had tested in staging but staging did not have the billing service connected. The billing dashboard was down for 40 minutes during business hours.",
      task:
        "I needed to restore service immediately, take responsibility for the outage, and ensure it would never happen again — while being a new hire who had just caused a significant incident.",
      action:
        "I immediately rolled back the migration (I had written a reversible migration, which saved us). I posted in the incident channel within 5 minutes, clearly stating 'I caused this — here is what I am doing to fix it.' After restoration, I wrote a thorough post-mortem identifying three systemic gaps: no billing service in staging, no column dependency checking in CI, and no migration review checklist. I proposed and implemented all three fixes over the next sprint.",
      result:
        "Total downtime was 40 minutes with no data loss. The three process improvements prevented 6 similar issues in the next quarter (tracked via CI blocks). My manager praised my post-mortem as 'the most thorough we have ever had.' The incident became a positive reference for my ownership mentality in my first performance review."
    },
    tips: [
      "Own the mistake immediately and publicly — do not deflect or minimize",
      "Focus your energy on the fix and systemic prevention, not self-blame",
      "Show that you turned a negative into lasting positive change"
    ],
    followUps: [
      "How did your team react when you took responsibility?",
      "What if you had not written a reversible migration?",
      "How has this experience changed how you approach deployments?"
    ]
  },
  {
    id: 16,
    question: "Describe a time you identified a problem no one else saw and fixed it.",
    category: "Leadership & Ownership",
    companies: ["Amazon", "Meta", "Apple"],
    leadershipPrinciple: "Dive Deep",
    seniority: "SDE-2",
    star: {
      situation:
        "While reviewing our monthly AWS bill at a travel booking platform, I noticed our S3 costs had increased 340% over 6 months despite flat traffic. No one had flagged it because each team only saw their own service costs. The total excess spend was $23K/month.",
      task:
        "I needed to trace the cost spike to specific services, fix the root causes, and establish monitoring to prevent future cost creep — all without any official mandate or time allocation.",
      action:
        "I used AWS Cost Explorer to tag costs by service and found three culprits: (1) a data pipeline writing duplicate Parquet files due to idempotency retry logic ($9K/month), (2) CloudWatch logs with debug level in production across 4 services ($8K/month), and (3) abandoned EBS snapshots from a decommissioned service ($6K/month). I filed PRs for each fix, set up a weekly cost anomaly Slack alert using AWS Budgets, and presented findings at our engineering all-hands.",
      result:
        "Monthly AWS costs dropped by $23K (from $38K to $15K). The annualized savings of $276K exceeded my entire team's salary budget. The weekly cost alert caught two more anomalies in the next quarter. Finance added cloud cost review to our quarterly engineering review process."
    },
    tips: [
      "Proactively reviewing costs shows business awareness — interviewers love this",
      "Break down the problem into specific, actionable root causes",
      "Annualize savings to make the impact resonate with business stakeholders"
    ],
    followUps: [
      "How did you prioritize which cost issue to fix first?",
      "What resistance did you encounter from the teams responsible?",
      "How do you build cost awareness into engineering culture?"
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER OBSESSION (6 stories)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 17,
    question: "Tell me about a time you went above and beyond for a customer.",
    category: "Customer Obsession",
    companies: ["Amazon", "Apple", "Google"],
    leadershipPrinciple: "Customer Obsession",
    seniority: "SDE-2",
    star: {
      situation:
        "Our largest enterprise customer at a document management SaaS (representing 15% of ARR) reported that PDF exports were corrupting for documents with embedded fonts. They had a regulatory filing deadline in 72 hours and were considering cancelling their $420K annual contract.",
      task:
        "I needed to diagnose and fix a complex rendering bug in our PDF export pipeline under extreme time pressure, with the customer's trust and a significant revenue stream at stake.",
      action:
        "I joined the customer's Slack channel directly (with our CSM), collected 8 sample documents, and set up a reproduction environment within 2 hours. I traced the issue to our font subsetting library mishandling CID-keyed fonts in CJK documents. I wrote a targeted fix that bypassed subsetting for CID fonts, added 23 regression tests covering different font types, deployed to a customer-specific canary at 11 PM, and validated all 8 samples with the customer by 8 AM the next morning.",
      result:
        "The customer hit their regulatory deadline with 36 hours to spare. They renewed their contract with a 20% upsell to our enterprise tier. The fix resolved the same issue for 47 other customers who had not reported it. The customer's CTO sent a testimonial that our sales team used for the next 6 months."
    },
    tips: [
      "Show urgency by joining the customer's communication channels",
      "Describe the technical debugging process — it shows depth",
      "Highlight the broader impact beyond the immediate customer"
    ],
    followUps: [
      "How did you manage your other commitments during those 72 hours?",
      "What if you could not reproduce the issue?",
      "How did you prevent this class of bug from recurring?"
    ]
  },
  {
    id: 18,
    question: "Describe a time you used customer feedback to change a product direction.",
    category: "Customer Obsession",
    companies: ["Amazon", "Meta", "Google"],
    leadershipPrinciple: "Customer Obsession",
    seniority: "Senior",
    star: {
      situation:
        "At an HR tech company, our product team spent 3 months building an AI-powered resume screener. During beta, I joined 5 customer calls and noticed a pattern: 4 out of 5 HR managers said they did not trust AI to screen resumes but desperately wanted help with scheduling interviews — our competitors all had poor calendar integration.",
      task:
        "I needed to present evidence that we should pivot our Q4 roadmap from AI screening to interview scheduling, which meant convincing the team to shelve 3 months of work.",
      action:
        "I compiled the feedback into a structured analysis: verbatim quotes, common themes, competitive landscape, and market sizing. I estimated the scheduling feature could reduce time-to-schedule from 4.2 days to 0.5 days (based on customer data). I organized a customer panel with 3 beta users presenting directly to our product and engineering leadership. I proposed keeping the AI screener as a 'beta' feature while prioritizing scheduling.",
      result:
        "Leadership approved the pivot. We shipped interview scheduling in 8 weeks. In 6 months, it became our #1 feature by usage (89% of customers), drove 34% of new sales, and reduced churn by 22%. The AI screener eventually launched 6 months later with the trust improvements customers requested. Revenue grew 3x that year."
    },
    tips: [
      "Let customers speak directly to leadership — second-hand feedback loses impact",
      "Frame the pivot as 'sequencing,' not 'abandoning' the original work",
      "Track the long-term outcome of the pivot to validate the decision"
    ],
    followUps: [
      "How did the engineers who built the AI screener react to the pivot?",
      "What if the customer panel had given mixed feedback?",
      "How do you distinguish between 'customers asking for a faster horse' and genuine insight?"
    ]
  },
  {
    id: 19,
    question: "Tell me about a time you anticipated a customer need before they asked.",
    category: "Customer Obsession",
    companies: ["Apple", "Amazon", "Netflix"],
    leadershipPrinciple: "Customer Obsession",
    seniority: "SDE-2",
    star: {
      situation:
        "At a fintech company, I noticed in our analytics that 23% of users who started the bank account linking flow abandoned it at the micro-deposit verification step. The step required users to check their bank account for two small deposits (which took 1-3 business days) and return to our app to enter the amounts.",
      task:
        "No customer had explicitly complained about this flow — our NPS was good at 52. But I believed we were losing significant conversion by not proactively solving the wait-time friction.",
      action:
        "I researched instant verification alternatives and proposed integrating Plaid Instant Auth as the primary method with micro-deposits as fallback. I built a cost analysis showing that Plaid's $0.30/verification cost would be offset by the increased conversion. I prototyped the integration in a 2-day hackathon, including error handling for the 15% of banks not supported by Plaid Instant Auth. I A/B tested both flows for 2 weeks.",
      result:
        "The instant verification flow increased completion rate from 77% to 94%. Time to link dropped from 2.3 days average to 12 seconds. Monthly active linked accounts grew 28% in the first quarter. NPS for the onboarding flow jumped from 52 to 71. The product team adopted my approach of 'analytics-first feature discovery' as a quarterly practice."
    },
    tips: [
      "Use analytics to find friction points customers have accepted as normal",
      "Show the cost-benefit analysis — proactive improvements need business justification",
      "A/B testing demonstrates rigor and de-risks the change"
    ],
    followUps: [
      "How did you prioritize this over features customers were explicitly requesting?",
      "What happened with the 15% of banks not supported by instant auth?",
      "How do you decide which drop-off rates are worth investigating?"
    ]
  },
  {
    id: 20,
    question: "Describe a time you simplified a complex product for end users.",
    category: "Customer Obsession",
    companies: ["Apple", "Google", "Meta"],
    leadershipPrinciple: "Invent and Simplify",
    seniority: "Senior",
    star: {
      situation:
        "Our developer tools platform at a cloud company had an onboarding wizard with 14 steps and 47 configuration options. New users took an average of 34 minutes to set up their first project, and 31% abandoned before completion. Support tickets for onboarding issues consumed 25% of our team's time.",
      task:
        "I was tasked with reducing onboarding friction while maintaining the flexibility that power users needed. The product team wanted zero-config defaults without losing advanced options.",
      action:
        "I analyzed the 47 configuration options and found that 82% of users kept defaults for 39 of them. I redesigned the wizard into 3 steps with smart defaults, moving advanced options to a 'Customize' expandable section. I implemented project templates (5 common patterns detected from usage data) that pre-filled configurations. I added a progress-saving mechanism so users could leave and return. We ran the new flow through 12 user testing sessions and iterated twice.",
      result:
        "Onboarding time dropped from 34 minutes to 4.5 minutes. Completion rate went from 69% to 93%. Support tickets for onboarding dropped 78%. Power users actually rated the new flow higher because templates saved them time too. Monthly new project creation increased 41% as the lower friction encouraged experimentation."
    },
    tips: [
      "Let usage data tell you which options are truly needed upfront",
      "Smart defaults with an escape hatch satisfy both novice and power users",
      "User testing sessions catch issues surveys never reveal"
    ],
    followUps: [
      "How did you decide which 3 steps to keep?",
      "What pushback did you get from engineers who built the original 14-step flow?",
      "How do you balance simplicity with discoverability of advanced features?"
    ]
  },
  {
    id: 21,
    question: "Tell me about a time you made a trade-off between customer experience and technical debt.",
    category: "Customer Obsession",
    companies: ["Amazon", "Netflix", "Microsoft"],
    leadershipPrinciple: "Customer Obsession",
    seniority: "SDE-2",
    star: {
      situation:
        "At a food delivery startup, our search results page took 3.2 seconds to load on mobile because the search service was doing synchronous calls to 5 microservices (menus, ratings, delivery estimates, promotions, and images). Product wanted a redesign of the search architecture (estimated 3 months), but customer complaints and a 15% bounce rate demanded immediate action.",
      task:
        "I needed to find a solution that improved user experience within 2 weeks while not creating technical debt that would block the longer-term architectural improvement.",
      action:
        "I implemented a two-phase rendering approach: the first render showed restaurant names, ratings, and cached images (available in 400ms from a denormalized cache), while delivery estimates and promotions loaded asynchronously with skeleton loaders. I added a Redis cache layer for the most common searches (covering 60% of queries). Critically, I designed the cache interface to match the planned new architecture's API contract, so the cache layer would become part of the long-term solution.",
      result:
        "Perceived load time dropped from 3.2s to 400ms. Bounce rate decreased from 15% to 4.8%. Order conversion from search improved 12% ($180K/month additional revenue). When the full architecture redesign happened 4 months later, 70% of my cache layer was reused directly. The 'progressive rendering' pattern became a standard practice for all our high-traffic pages."
    },
    tips: [
      "Show that you can balance urgency with long-term thinking",
      "Design quick fixes to be compatible with the planned architecture",
      "Use perceived performance metrics (time to first meaningful content) not just total load time"
    ],
    followUps: [
      "What if the cache data became stale — how did you handle consistency?",
      "How did you convince the team this was not just adding more tech debt?",
      "What metrics did you monitor after deployment to ensure the fix was working?"
    ]
  },
  {
    id: 22,
    question: "Describe a time you advocated for accessibility or inclusion in a product.",
    category: "Customer Obsession",
    companies: ["Microsoft", "Google", "Apple"],
    leadershipPrinciple: "Customer Obsession",
    seniority: "SDE-2",
    star: {
      situation:
        "During a routine usability test at our edtech platform, I observed a visually impaired student struggle to use our code editor — screen readers could not parse the syntax highlighting, and keyboard navigation between code cells was broken. Our platform had 12,000 active students, and accessibility was not in any team's OKRs.",
      task:
        "I wanted to make our code editor fully accessible, knowing this would benefit not just visually impaired users but also power users who preferred keyboard-driven workflows.",
      action:
        "I audited our platform against WCAG 2.1 AA standards and found 34 violations. I prioritized the top 10 by user impact, focusing first on the code editor. I added ARIA labels for syntax tokens, implemented keyboard-navigable code cells (Ctrl+Up/Down), added a high-contrast mode, and integrated with NVDA and VoiceOver screen readers. I partnered with our university's disability services office to recruit 5 visually impaired students for testing.",
      result:
        "We resolved 28 of 34 WCAG violations. Three universities added us to their approved accessible platforms list, opening a $600K pipeline. One visually impaired student completed our advanced Python course and wrote a testimonial featured on our homepage. Our keyboard navigation was so well received that 40% of sighted users adopted it, reducing their average task completion time by 18%."
    },
    tips: [
      "Connect accessibility to business value: new markets, compliance, and power users",
      "Test with actual users who have disabilities, not just automated tools",
      "Show that accessible design benefits everyone"
    ],
    followUps: [
      "How did you convince leadership to prioritize accessibility without it being in OKRs?",
      "What were the remaining 6 WCAG violations and why were they harder to fix?",
      "How do you prevent accessibility regressions as the product evolves?"
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // INNOVATION & PROBLEM SOLVING (6 stories)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 23,
    question: "Tell me about the most innovative solution you have built.",
    category: "Innovation & Problem Solving",
    companies: ["Google", "Meta", "Netflix"],
    leadershipPrinciple: "Invent and Simplify",
    seniority: "Senior",
    star: {
      situation:
        "At a logistics company, our route optimization algorithm for delivery drivers used a greedy nearest-neighbor approach, resulting in 23% longer routes than optimal. Each extra mile cost $0.58 in fuel and driver time. With 4,000 daily deliveries, this was costing $340K/year in wasted miles.",
      task:
        "I was challenged to reduce delivery route distance by at least 15% without requiring a full rewrite of our dispatching system or adding expensive third-party optimization APIs.",
      action:
        "I researched constraint optimization approaches and implemented a hybrid solution: a 2-opt local search improvement on top of our existing nearest-neighbor output, combined with time-window clustering using k-means to group deliveries geographically before routing. I ran the new algorithm against 30 days of historical data to validate. The key insight was that we did not need a globally optimal solution — a locally improved solution was sufficient. I implemented it as a post-processing step, so the existing system remained untouched.",
      result:
        "Average route distance decreased by 19.3%. Annual fuel and time savings were $287K. Driver satisfaction scores improved 14% (shorter routes meant earlier finish times). The post-processing approach meant zero deployment risk. I filed a patent application for the time-window clustering technique. The system was later adopted by two sister companies in the same logistics group."
    },
    tips: [
      "Show creative problem reframing: 'we do not need optimal, we need better'",
      "Building on top of existing systems reduces risk and accelerates delivery",
      "Connect the technical innovation to tangible business metrics"
    ],
    followUps: [
      "Why did you choose 2-opt over other optimization heuristics?",
      "How did you handle edge cases like same-address deliveries or time constraints?",
      "What would it take to get to truly optimal routes?"
    ]
  },
  {
    id: 24,
    question: "Describe a time you solved a problem that others had given up on.",
    category: "Innovation & Problem Solving",
    companies: ["Amazon", "Google", "Apple"],
    leadershipPrinciple: "Dive Deep",
    seniority: "SDE-2",
    star: {
      situation:
        "Our e-commerce search had a 'phantom results' bug for 8 months: users would see items in search results that showed 'out of stock' when clicked. Three engineers had investigated and concluded it was an Elasticsearch eventual consistency issue that was 'unfixable' without a complete re-index architecture. The bug generated 200+ support tickets monthly.",
      task:
        "I took on the investigation as a personal challenge, determined to find the actual root cause rather than accepting it as an inherent limitation.",
      action:
        "I built a diagnostic pipeline that captured search result IDs and checked inventory status in real-time for 10,000 searches. The data showed phantom results appeared only for items that went out of stock between 2-4 AM. I traced the issue to our inventory sync job: it ran at 1 AM but used a database snapshot from 11 PM (2-hour stale data). The Elasticsearch index refreshed at 4 AM using the stale sync. The fix was simple: change the inventory sync to use a real-time database connection instead of the snapshot, and trigger an index refresh immediately after.",
      result:
        "Phantom results dropped from 3.4% to 0.02% (only genuine race conditions). Monthly support tickets for this issue went from 200+ to 3. Search-to-purchase conversion improved 2.1%. Total time to fix: 1 week of investigation, 4 hours of code changes. The experience led me to create a 'data freshness audit' checklist that the team now uses for all data pipeline reviews."
    },
    tips: [
      "When others give up, the bug is usually in an assumption, not the technology",
      "Build diagnostic tooling to gather data rather than theorizing",
      "Emphasize the contrast: small fix after deep investigation shows the value of persistence"
    ],
    followUps: [
      "How did you approach it differently from the three engineers before you?",
      "What if the real-time connection introduced too much database load?",
      "How do you decide when a problem is truly unsolvable vs. just hard?"
    ]
  },
  {
    id: 25,
    question: "Tell me about a time you had to build something from scratch with no existing solution.",
    category: "Innovation & Problem Solving",
    companies: ["Meta", "Netflix", "Amazon"],
    leadershipPrinciple: "Invent and Simplify",
    seniority: "Senior",
    star: {
      situation:
        "At a video streaming startup, we needed to detect and flag copyrighted content in user uploads before publishing. Existing solutions (like YouTube's Content ID) were not available to us, and third-party APIs cost $0.12 per video minute — at 50,000 hours of uploads per month, that was $360K/month, far beyond our budget.",
      task:
        "I needed to build an in-house content fingerprinting system that could match copyrighted audio in uploaded videos against a reference database of 500K tracks, at a cost of under $10K/month.",
      action:
        "I researched audio fingerprinting algorithms and implemented a chromaprint-based approach: extract audio from uploads, generate acoustic fingerprints (spectral features), and compare against pre-computed fingerprints of reference tracks using locality-sensitive hashing (LSH) for fast approximate matching. I used FFmpeg for audio extraction, a custom Rust service for fingerprint computation, and PostgreSQL with the pg_similarity extension for matching. I deployed on 4 spot instances with auto-scaling.",
      result:
        "The system processed uploads at 12x real-time speed with 97.3% detection accuracy (validated against a manually-labeled test set of 5,000 videos). False positive rate was 0.4%. Infrastructure cost was $2,800/month — 99.2% cheaper than the third-party API. The system scaled to handle 2x traffic growth over the next year without architecture changes. We open-sourced the fingerprinting library and it gained 3.4K GitHub stars."
    },
    tips: [
      "Show your research process and why you chose the specific technical approach",
      "Cost comparison makes the business case crystal clear",
      "Accuracy metrics and false positive rates show engineering rigor"
    ],
    followUps: [
      "How did you handle false positives — what was the review process?",
      "What were the limitations of your approach compared to Content ID?",
      "How did you build and maintain the reference database of 500K tracks?"
    ]
  },
  {
    id: 26,
    question: "Describe a creative workaround you implemented under severe constraints.",
    category: "Innovation & Problem Solving",
    companies: ["Amazon", "Apple", "Microsoft"],
    leadershipPrinciple: "Frugality",
    seniority: "Fresh Grad",
    star: {
      situation:
        "At a nonprofit edtech organization, we needed to deliver interactive coding exercises to students in rural India with intermittent internet (average 2G speeds, 50% packet loss). Our web-based code editor required 3MB of JavaScript and constant server communication for code execution.",
      task:
        "I needed to make our coding platform work reliably for 5,000 students who had nothing better than 2G connectivity and used budget Android phones with 1-2GB RAM.",
      action:
        "I built an offline-first Progressive Web App: the code editor was a lightweight textarea with syntax highlighting via a 40KB library (replacing Monaco Editor's 3MB). For code execution, I compiled a subset of Python exercises to run client-side using Brython (200KB). I implemented a service worker that cached all lesson content (50 lessons = 800KB) and queued submission results for sync when connectivity returned. I tested on a $60 Redmi phone on throttled 2G to ensure real-world performance.",
      result:
        "The app loaded in 4.2 seconds on 2G (down from 'never' on the old platform). Student completion rates jumped from 23% to 71%. The app worked fully offline for all 50 lessons. Data usage dropped from 15MB/lesson to 200KB for initial load plus 2KB per submission. The nonprofit's director presented our approach at a UNESCO education technology conference."
    },
    tips: [
      "Extreme constraints drive the most creative solutions — frame them positively",
      "Always test on the actual hardware and network conditions your users have",
      "Quantify the impact in human terms (completion rates) not just technical metrics"
    ],
    followUps: [
      "How did you decide which Python features to support client-side?",
      "What happened when students tried exercises that could not run offline?",
      "How did you handle code submission integrity with delayed syncing?"
    ]
  },
  {
    id: 27,
    question: "Tell me about a time you used data to drive a non-obvious technical decision.",
    category: "Innovation & Problem Solving",
    companies: ["Google", "Netflix", "Meta"],
    leadershipPrinciple: "Dive Deep",
    seniority: "SDE-2",
    star: {
      situation:
        "At a social media analytics company, our dashboard rendering was slow (8-second average load) and the team assumed the bottleneck was our PostgreSQL queries. Two engineers spent 3 weeks optimizing queries with minimal improvement (8s down to 7.2s). The CPO was pressuring for sub-2-second loads.",
      task:
        "I suspected the bottleneck was elsewhere but needed data to prove it. I volunteered to do a comprehensive performance audit before more engineering time was spent on database optimization.",
      action:
        "I instrumented every layer of the stack with timing markers: React render, API serialization, network transfer, database query, and data transformation. The data revealed the actual breakdown: DB queries took 0.8s, API serialization 0.6s, network transfer 0.4s, but client-side data transformation and React rendering took 5.4s — 75% of the total time. The dashboards were rendering 200K data points into DOM charts. I replaced client-side charting with server-side aggregation (reducing 200K points to 500 display points) and switched from a DOM-based charting library to Canvas-based rendering.",
      result:
        "Dashboard load time dropped from 7.2s to 1.4s. The database optimization work was not wasted (it still helped), but the 5x improvement came from fixing the actual bottleneck. Memory usage on client devices dropped from 1.2GB to 180MB. The instrumentation framework I built became our standard performance debugging tool, used in 3 subsequent optimization projects."
    },
    tips: [
      "Always measure before optimizing — assumptions about bottlenecks are often wrong",
      "Full-stack instrumentation reveals problems that single-layer profiling misses",
      "Credit previous work while showing the additional insight data provided"
    ],
    followUps: [
      "How did you communicate to the team that the DB optimization was not the primary issue?",
      "What trade-offs came with server-side aggregation (loss of client-side drill-down)?",
      "How do you decide how many data points to aggregate to?"
    ]
  },
  {
    id: 28,
    question: "Describe a time you simplified an overly complex system.",
    category: "Innovation & Problem Solving",
    companies: ["Google", "Amazon", "Apple"],
    leadershipPrinciple: "Invent and Simplify",
    seniority: "Senior",
    star: {
      situation:
        "At a fintech company, our payment processing pipeline had evolved over 4 years into a chain of 11 microservices. A single payment touched all 11 services sequentially, with an end-to-end latency of 4.7 seconds and a failure rate of 2.3% (compounding ~0.2% per service). Debugging payment failures required checking logs across all 11 services.",
      task:
        "I was asked to reduce payment latency to under 1 second and failure rate to under 0.5% without a full system rewrite, as the payment pipeline processed $12M/day.",
      action:
        "I mapped data flow through all 11 services and found that 6 of them were doing transformations that could be combined: currency conversion, fee calculation, tax lookup, compliance check, fraud scoring, and ledger formatting. These 6 services shared the same database and had no independent scaling needs. I consolidated them into a single 'payment-core' service with well-tested modules, kept the remaining 5 services that had genuine isolation needs (gateway, 3 bank adapters, notification), and made bank adapter calls parallel instead of sequential.",
      result:
        "End-to-end latency dropped from 4.7s to 0.9s. Failure rate went from 2.3% to 0.3%. Infrastructure costs decreased 38% (fewer containers, databases, and inter-service network calls). Debugging time for payment issues dropped from 45 minutes average to 8 minutes. The consolidation was done incrementally over 6 weeks with zero downtime using feature flags."
    },
    tips: [
      "Challenge the assumption that more microservices equals better architecture",
      "Map actual data dependencies to identify services that should not be separate",
      "Incremental migration with feature flags de-risks the consolidation"
    ],
    followUps: [
      "How did you decide which 5 services to keep separate?",
      "What pushback did you get from teams who owned the individual services?",
      "How did you ensure the consolidated service did not become a monolith anti-pattern?"
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // FAILURE & LEARNING (6 stories)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 29,
    question: "Tell me about your biggest professional failure.",
    category: "Failure & Learning",
    companies: ["Amazon", "Google", "Meta"],
    leadershipPrinciple: "Learn and Be Curious",
    seniority: "SDE-2",
    star: {
      situation:
        "I led a 4-month project to build a real-time recommendation engine at a media company. I chose to build a custom collaborative filtering system from scratch instead of using an existing solution like AWS Personalize, because I wanted our team to own the ML pipeline. We invested 2,400 engineering hours across 4 engineers.",
      task:
        "At the 3-month mark, our custom system was achieving only 3.2% click-through improvement vs. the 12% target. I had to decide whether to continue investing or acknowledge the approach was failing and pivot.",
      action:
        "I swallowed my pride and called an honest retrospective with the team. We identified that our biggest gap was training data quality, not algorithm sophistication — a problem that AWS Personalize's pre-built data pipelines handled well. I proposed scrapping the custom engine and migrating to Personalize. I took full responsibility in the project review meeting, explaining what I learned about build-vs-buy decision-making. I created a decision framework document for future build-vs-buy choices.",
      result:
        "We launched with AWS Personalize in 5 weeks and hit 14.2% CTR improvement. The total project took 5 months instead of the original 4-month estimate, but the outcome exceeded targets. The build-vs-buy framework I created was adopted company-wide and prevented at least two similar misjudgments in the next year. My transparency about the failure was cited positively in my performance review."
    },
    tips: [
      "Be genuinely honest about the failure — do not disguise a success as a failure story",
      "Show the specific moment you recognized the failure and decided to act",
      "Emphasize systemic learnings (frameworks, processes) not just personal growth"
    ],
    followUps: [
      "Looking back, what signals should have told you earlier to pivot?",
      "How did the team react when you proposed scrapping their work?",
      "How do you use the build-vs-buy framework today?"
    ]
  },
  {
    id: 30,
    question: "Describe a time a project you led did not meet its goals.",
    category: "Failure & Learning",
    companies: ["Amazon", "Microsoft", "Netflix"],
    leadershipPrinciple: "Deliver Results",
    seniority: "Senior",
    star: {
      situation:
        "I led a migration from a monolithic Spring Boot application to microservices at a banking software company. We planned to decompose 8 bounded contexts over 6 months. After 6 months, we had extracted only 3 services, and the partially-migrated system had 40% more operational incidents than the original monolith.",
      task:
        "I needed to honestly assess why we were behind, stop the bleeding on operational issues, and present a revised plan to leadership that preserved credibility.",
      action:
        "I conducted a candid team retrospective and identified three root causes: (1) we underestimated cross-cutting concerns (auth, logging, tracing) for each new service, (2) we did not invest in observability before decomposing, and (3) I had set an arbitrary 6-month timeline without bottom-up estimates from the team. I paused further decomposition, spent 4 weeks building proper observability (distributed tracing, centralized logging, health dashboards), and re-estimated the remaining work with the team. I presented to leadership with an honest assessment and revised 10-month timeline.",
      result:
        "The observability investment reduced incidents from 12/month to 2/month within 6 weeks. We completed the remaining 5 service extractions in 7 months (total: 13 months vs. original 6-month plan). The final microservices architecture reduced deployment time from 45 minutes to 4 minutes per service and enabled independent team scaling. Leadership appreciated the transparency and the revised plan became a template for future migrations."
    },
    tips: [
      "Admit the timeline miss candidly — everyone in the room already knows",
      "Show root cause analysis of WHY the project fell behind, not just THAT it did",
      "Demonstrate that you adapted your approach, not just extended the deadline"
    ],
    followUps: [
      "Would you still choose microservices for that system?",
      "How did you maintain team morale during the extended timeline?",
      "What would you do differently if starting a similar migration today?"
    ]
  },
  {
    id: 31,
    question: "Tell me about a time you shipped a bug to production and how you handled it.",
    category: "Failure & Learning",
    companies: ["Google", "Meta", "Amazon"],
    leadershipPrinciple: "Ownership",
    seniority: "Fresh Grad",
    star: {
      situation:
        "During my first on-call rotation at a social media company, I deployed a feature flag change that accidentally enabled an unfinished A/B test for all 2M users. The test replaced the main feed algorithm with an experimental one that showed posts in reverse chronological order only. Engagement metrics dropped 23% within 30 minutes.",
      task:
        "I needed to identify the issue, roll back safely, communicate transparently, and ensure this category of mistake could not happen again.",
      action:
        "I noticed the engagement drop on our real-time dashboard within 15 minutes. It took me another 20 minutes to trace it to my feature flag change because I did not initially suspect my 'minor config update.' Once identified, I rolled back the flag in 2 minutes. I immediately posted in our incident channel, paged the feature flag team lead, and started writing the post-mortem. In the post-mortem, I proposed three changes: (1) feature flags affecting >10% of users require a second reviewer, (2) automated rollback triggers for engagement drops >10% within 15 minutes, and (3) a staging environment that mirrors production feature flag state.",
      result:
        "Total impact was 45 minutes of degraded experience. No data was lost. All three process improvements were implemented within 2 sprints. The automated rollback trigger prevented 3 similar incidents in the next 6 months. My post-mortem was used as a training example for new on-call engineers. My manager noted that my response was 'exactly what we want from engineers — fast detection, honest communication, systemic fixes.'"
    },
    tips: [
      "Speed of detection and response matters more than prevention in the story",
      "Take ownership even when the root cause was partially systemic",
      "Three concrete process improvements shows systemic thinking"
    ],
    followUps: [
      "Why did it take 20 minutes to connect the drop to your change?",
      "How would you have handled it if the rollback did not fix the issue?",
      "How has this experience changed your deployment practices?"
    ]
  },
  {
    id: 32,
    question: "Describe a time you made a wrong hire or team composition decision.",
    category: "Failure & Learning",
    companies: ["Amazon", "Netflix", "Google"],
    leadershipPrinciple: "Hire and Develop the Best",
    seniority: "Senior",
    star: {
      situation:
        "As a tech lead scaling my team from 4 to 8 at a cybersecurity company, I prioritized hiring for raw technical skill over team fit. I hired a brilliant engineer who had impressive LeetCode scores and system design skills but showed subtle signs of poor collaboration during interviews that I dismissed. Within 2 months, he refused to participate in code reviews, rewrote a teammate's PR without discussion, and created a toxic 'my code is superior' dynamic.",
      task:
        "I had to address the team dynamic without losing the engineer's genuine technical contributions, or make the hard decision if coaching did not work.",
      action:
        "I had three structured 1:1 conversations over 6 weeks, each with specific behavioral expectations and timelines. I documented each conversation. After the third conversation showed minimal improvement, I worked with HR to transition him off the team. I then reflected on our interview process and added two changes: a pair-programming interview round that assesses collaboration (not just skill) and a 'team-add' evaluation where existing team members provide structured feedback on candidates.",
      result:
        "Team velocity actually increased 20% after the departure despite losing strong individual output — collaboration was the multiplier. The pair-programming interview round became our strongest signal for team fit. In the next 6 hires using the new process, zero had collaboration issues. I learned that a 10x individual contributor can be a 0.5x team multiplier."
    },
    tips: [
      "Show vulnerability — hiring mistakes are common but rarely discussed honestly",
      "Demonstrate a fair, documented process before making the hard call",
      "The process improvement (interview changes) shows lasting impact"
    ],
    followUps: [
      "What specific signs did you dismiss during the interview?",
      "How did you communicate the departure to the team?",
      "How do you balance technical bar with team fit in interviews now?"
    ]
  },
  {
    id: 33,
    question: "Tell me about a time you overengineered a solution.",
    category: "Failure & Learning",
    companies: ["Google", "Amazon", "Apple"],
    leadershipPrinciple: "Frugality",
    seniority: "SDE-2",
    star: {
      situation:
        "At a startup with 500 daily active users, I built a notification system designed to handle 10M users: event-driven architecture with Kafka, a custom dead-letter queue, multi-channel delivery (push, email, SMS, in-app) with per-channel retry policies, and a notification preference center. It took 8 weeks and touched 12 services.",
      task:
        "Three months after launch, I realized the system was consuming 35% of our AWS bill ($4,200/month) for infrastructure that was processing 2,000 notifications per day — a workload a simple cron job with SendGrid could have handled. My manager asked me to present a cost analysis.",
      action:
        "I wrote an honest analysis showing the system was over-provisioned by 5,000x. I proposed a simplified architecture: a single service with a PostgreSQL-backed queue and direct SendGrid/Firebase integration. I committed to migrating in 2 weeks. I also created a 'scale decision framework' for the team: if you have fewer than 10K users, start simple; design for 10x growth, not 1000x. I presented the lessons learned at our engineering all-hands without sugarcoating my mistake.",
      result:
        "The simplified system handled the same workload with $180/month in infrastructure (96% cost reduction). Migration took 10 days with zero notification delivery failures. The scale decision framework was adopted by 3 other teams and prevented similar overengineering in our analytics pipeline (saved an estimated $8K/month in planned but unnecessary Kafka clusters). My willingness to publicly own the mistake earned team trust."
    },
    tips: [
      "This is a great story for demonstrating self-awareness and growth",
      "Quantify the waste honestly — it makes the lesson memorable",
      "Show that the framework you created prevents others from repeating the mistake"
    ],
    followUps: [
      "At what scale would the original architecture have been appropriate?",
      "How do you balance 'building for scale' with 'YAGNI' now?",
      "Did any part of the original system have value for the simplified version?"
    ]
  },
  {
    id: 34,
    question: "Describe a time you failed to communicate effectively and it caused problems.",
    category: "Failure & Learning",
    companies: ["Meta", "Microsoft", "Amazon"],
    leadershipPrinciple: "Earn Trust",
    seniority: "SDE-2",
    star: {
      situation:
        "I was leading the backend for a feature launch at a marketplace platform. I identified a data migration risk 3 weeks before launch but only mentioned it casually in a standup ('the migration might take longer than expected'). I did not follow up with a written risk assessment or escalate. The migration ran 4 hours longer than expected on launch day, delaying the launch by a full day and impacting a marketing campaign that cost $50K.",
      task:
        "After the incident, I needed to understand why my communication failed and implement changes to prevent similar miscommunications in future launches.",
      action:
        "In the retrospective, I acknowledged that I had identified the risk but failed in three ways: (1) verbal-only communication for a critical risk, (2) no severity classification, and (3) no follow-up action item. I proposed a 'launch readiness checklist' that included mandatory written risk assessments for any item that could delay launch by more than 2 hours, a red/yellow/green status board visible to all stakeholders, and a 'risk owner' assigned for each item with a mitigation deadline.",
      result:
        "The launch readiness checklist was adopted for all feature launches. In the next 6 launches, zero had surprise delays. The marketing team regained trust in engineering timelines. I personally made a habit of following every verbal risk flag with a written summary in Slack within 1 hour. My manager noted the improvement in my written communication as a strength in my next review."
    },
    tips: [
      "This story resonates because everyone has under-communicated a risk",
      "Be specific about what you should have done differently",
      "Show the behavioral change, not just the process change"
    ],
    followUps: [
      "How do you decide what warrants written escalation vs. a verbal mention?",
      "How did the marketing team react during the delayed launch?",
      "What other communication failures have you learned from?"
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // TEAMWORK & COLLABORATION (6 stories)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 35,
    question: "Tell me about your best experience working on a cross-functional team.",
    category: "Teamwork & Collaboration",
    companies: ["Google", "Meta", "Microsoft"],
    leadershipPrinciple: "Earn Trust",
    seniority: "SDE-2",
    star: {
      situation:
        "At a health insurance company, I was assigned to a 'tiger team' with 2 engineers, 1 data scientist, 1 product manager, and 1 compliance officer to build a claims fraud detection system. The challenge was that each discipline had different priorities: engineering wanted accuracy, data science wanted model complexity, product wanted speed to market, and compliance needed explainability.",
      task:
        "As the lead engineer, I needed to create a technical architecture that satisfied all four stakeholders' requirements while keeping the project on its 12-week timeline.",
      action:
        "I organized a 'constraints workshop' where each person listed their non-negotiable requirements (not wants). This narrowed our design space significantly. I then proposed a two-model approach: a fast heuristic model for real-time flagging (satisfying product's speed need) feeding into a more complex ML model for detailed analysis (satisfying data science), with a decision tree export for compliance explainability. I set up a shared dashboard where everyone could track their metrics. I also introduced 'perspective rotations' — each standup, one team member explained a decision from another discipline's viewpoint.",
      result:
        "We delivered in 11 weeks. The system caught $2.3M in fraudulent claims in its first quarter. The compliance team approved on first review (unprecedented — previous ML projects required 3+ revision cycles). The 'constraints workshop' and 'perspective rotation' practices were adopted by two other cross-functional teams. The data scientist and I co-published an internal whitepaper on the two-model approach."
    },
    tips: [
      "Highlight how you bridged different disciplines, not just managed them",
      "The 'constraints workshop' technique shows structured facilitation skills",
      "Perspective rotations show genuine investment in cross-functional empathy"
    ],
    followUps: [
      "How did you handle disagreements between disciplines?",
      "What would you have done if the 12-week timeline was not feasible?",
      "How did you ensure the fast heuristic model did not create too many false positives?"
    ]
  },
  {
    id: 36,
    question: "Describe a time you helped an underperforming teammate succeed.",
    category: "Teamwork & Collaboration",
    companies: ["Amazon", "Google", "Microsoft"],
    leadershipPrinciple: "Develop the Best",
    seniority: "SDE-2",
    star: {
      situation:
        "A mid-level engineer who joined our team at a data analytics company was struggling with our codebase — a complex Scala data pipeline with heavy use of functional programming patterns. After 6 weeks, he had merged only 1 PR (team average was 3-4/week) and was visibly frustrated. He came from a Java background and the paradigm shift was overwhelming.",
      task:
        "I wanted to help him become productive without being condescending. He was technically strong — the gap was specifically Scala/FP patterns, not engineering ability.",
      action:
        "I proposed a 'pairing sprint': for 2 weeks, we would pair program for 2 hours each morning on real production tasks (not toy examples). I let him drive while I navigated, explaining FP patterns in Java analogies he understood. I created a 'Scala for Java Engineers' cheat sheet mapping common Java patterns to their Scala equivalents (Builder pattern to case class copy, Iterator to Stream, etc.). I also restructured our onboarding docs to include FP concept explanations.",
      result:
        "By week 3, his PR rate reached 2/week. By week 6, he was at team average (3.5/week) and his code required fewer review iterations than when he started. He contributed a major refactor of our data partitioning logic using monadic error handling — something he could not have written 2 months earlier. The 'Scala for Java Engineers' cheat sheet became our standard onboarding doc and reduced ramp-up time for 4 subsequent hires from 6 weeks to 3 weeks."
    },
    tips: [
      "Frame the gap as a paradigm mismatch, not a skill deficiency",
      "Pairing on real tasks builds context and confidence simultaneously",
      "Creating reusable onboarding materials multiplies the impact"
    ],
    followUps: [
      "How did you find 2 hours/day for pairing alongside your own work?",
      "What if he had been struggling with general engineering skills, not just Scala?",
      "How do you know when to invest in helping vs. escalating to management?"
    ]
  },
  {
    id: 37,
    question: "Tell me about a time you worked with a remote or distributed team.",
    category: "Teamwork & Collaboration",
    companies: ["Meta", "Google", "Amazon"],
    leadershipPrinciple: "Earn Trust",
    seniority: "Senior",
    star: {
      situation:
        "At a SaaS company, I led a project with 4 engineers in San Francisco, 3 in Bangalore, and 2 in London. Our initial velocity was 40% lower than co-located teams. The Bangalore team felt excluded from design decisions (made during SF morning standups), the London team's PRs sat unreviewed for 12+ hours, and knowledge silos developed along geographic lines.",
      task:
        "I needed to make this distributed team as effective as a co-located one without requiring anyone to work unreasonable hours.",
      action:
        "I implemented three structural changes: (1) Rotated standup times weekly across time zones so no team was always inconvenienced, (2) Moved all design discussions to asynchronous Notion docs with 48-hour comment windows before decisions, ensuring every timezone could contribute, (3) Created cross-geo 'review pairs' so every PR had a reviewer in a different timezone (faster turnaround via timezone advantage). I also started each sprint with a 30-minute video social — no work talk, just team bonding.",
      result:
        "Team velocity increased to match co-located teams within 6 weeks. PR review turnaround dropped from 12 hours to 3.5 hours (timezone handoffs became an advantage). The Bangalore team contributed 3 major design proposals in the next quarter (versus zero in the previous quarter). Employee satisfaction scores for the distributed team went from 3.2/5 to 4.4/5. The distributed collaboration playbook was adopted by 5 other teams."
    },
    tips: [
      "Turn timezone differences from a problem into an advantage (follow-the-sun reviews)",
      "Async-first decisions are fairer than synchronous meetings for distributed teams",
      "Social connection across geographies prevents 'us vs them' dynamics"
    ],
    followUps: [
      "How did you handle urgent decisions that could not wait 48 hours?",
      "What was the hardest part of changing the team's communication habits?",
      "How did you measure team effectiveness beyond velocity?"
    ]
  },
  {
    id: 38,
    question: "Describe a time you had to onboard yourself quickly into an unfamiliar codebase.",
    category: "Teamwork & Collaboration",
    companies: ["Google", "Netflix", "Apple"],
    leadershipPrinciple: "Learn and Be Curious",
    seniority: "Fresh Grad",
    star: {
      situation:
        "I joined an infrastructure team at a cloud company and was assigned a critical bug within my first week: a memory leak causing our service mesh proxy to crash every 18 hours. The codebase was 150K lines of C++ with minimal documentation. The original author had left the company 6 months ago.",
      task:
        "I needed to understand enough of the codebase to find and fix a memory leak in a language and domain (service mesh proxies) I had limited experience with, while the issue was causing 3 production restarts per day.",
      action:
        "I took a structured approach: Day 1 — read the build system and entry points, drew a high-level component diagram. Day 2 — ran the service under Valgrind in a local environment, identified the leak in a connection pool that was not releasing TLS session objects. Day 3 — traced the code path, found that the TLS session cache grew unbounded when downstream services rotated certificates (which happened every 12 hours). Day 4 — implemented a fix with an LRU eviction policy and TTL on cached sessions, wrote 3 targeted tests. Day 5 — deployed to canary, monitored memory for 48 hours.",
      result:
        "The fix resolved the crash entirely. Memory usage stabilized at 340MB instead of growing to 4GB and crashing. My component diagram became the team's first architecture doc, updated and maintained by subsequent team members. My manager said it was the fastest onboarding-to-impact she had seen. I was asked to mentor the next new hire on the structured onboarding approach I used."
    },
    tips: [
      "Show your systematic approach: do not just 'look at code randomly'",
      "Day-by-day narration demonstrates structured problem solving under time pressure",
      "Leave artifacts (diagrams, docs) that help future team members"
    ],
    followUps: [
      "What if Valgrind had not clearly identified the leak?",
      "How did you decide what parts of the 150K line codebase to focus on?",
      "What would you do differently if the bug were not time-sensitive?"
    ]
  },
  {
    id: 39,
    question: "Tell me about a time you gave difficult feedback to a peer.",
    category: "Teamwork & Collaboration",
    companies: ["Netflix", "Amazon", "Google"],
    leadershipPrinciple: "Earn Trust",
    seniority: "SDE-2",
    star: {
      situation:
        "A peer engineer at my level at a fintech company had developed a pattern of taking credit for team work in leadership meetings. He would present features built by the team as 'my project' and omit contributors' names. Two junior engineers confided in me that they felt demoralized. Our manager seemed unaware.",
      task:
        "I needed to address this directly with my peer because it was damaging team morale and trust, but I also wanted to maintain our working relationship since we collaborated on the same codebase daily.",
      action:
        "I used the SBI (Situation-Behavior-Impact) framework in a private 1:1. I said: 'In last Thursday's leadership update [Situation], you presented the payment retry feature as something you built [Behavior]. Priya and James did 70% of the implementation and they feel their contributions are invisible [Impact].' I was specific, not accusatory. I also suggested an alternative: using 'the team shipped...' language and calling out individual contributors. I offered to co-present our next feature to model inclusive presentation style.",
      result:
        "He was genuinely surprised — he had not realized the pattern. In the next leadership meeting, he specifically credited Priya and James by name. Team morale survey scores improved from 3.1 to 4.2 over the next quarter. He thanked me 3 months later and said it was the most useful feedback he had received. Priya was promoted in the next cycle, with her newly-visible contributions as supporting evidence."
    },
    tips: [
      "Use a specific framework (SBI) to keep feedback objective and non-personal",
      "Have the conversation privately and quickly — do not let resentment build",
      "Offer to model the alternative behavior, not just point out the problem"
    ],
    followUps: [
      "What if he had become defensive or denied it?",
      "Should you have escalated to the manager instead?",
      "How do you decide whether to give feedback directly vs. through a manager?"
    ]
  },
  {
    id: 40,
    question: "Describe a time you collaborated with a non-technical stakeholder.",
    category: "Teamwork & Collaboration",
    companies: ["Amazon", "Microsoft", "Apple"],
    leadershipPrinciple: "Customer Obsession",
    seniority: "SDE-2",
    star: {
      situation:
        "The legal team at our contract management SaaS needed an export feature for regulatory compliance — they had to produce all customer contracts in a specific XML format within 72 hours of a government request. The legal team could not articulate technical requirements, and engineers who had previously worked with them described legal requirements as 'vague and changing.'",
      task:
        "I volunteered to be the engineering liaison and translate legal requirements into a buildable specification while maintaining a productive working relationship with a team that had been frustrated by past engineering interactions.",
      action:
        "Instead of asking legal for a spec, I spent a day learning the regulatory requirements myself (GDPR Article 20, data portability). I then built a quick prototype XML export and showed it to the legal lead, saying 'is this what you need?' This gave them something concrete to react to. Over 3 sessions, we iterated on the prototype together. I translated their feedback ('we need the contract date in European format') into technical specs in real-time. I also created a visual flowchart of the entire compliance export process so both teams could reference the same artifact.",
      result:
        "We shipped the compliance export in 3 weeks. The legal team used it successfully in a real regulatory request with zero issues. The visual flowchart was included in our SOC2 audit documentation. The legal lead specifically requested me for the next 2 compliance engineering projects. Our VP of Legal mentioned at the company all-hands that 'engineering and legal finally speak the same language.'"
    },
    tips: [
      "Prototypes are more effective than requirements docs for non-technical stakeholders",
      "Invest time learning their domain — it earns respect and reduces back-and-forth",
      "Shared visual artifacts bridge the communication gap permanently"
    ],
    followUps: [
      "How did you handle requirements that changed during the 3 iteration sessions?",
      "What if the legal requirements conflicted with engineering best practices?",
      "How do you scale this approach when you cannot be the liaison for every project?"
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // TIME MANAGEMENT & PRIORITIZATION (5 stories)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 41,
    question: "Tell me about a time you had to juggle multiple competing priorities.",
    category: "Time Management & Prioritization",
    companies: ["Amazon", "Google", "Meta"],
    leadershipPrinciple: "Deliver Results",
    seniority: "SDE-2",
    star: {
      situation:
        "In the same week at a payments company, I had three high-priority items land simultaneously: (1) a P1 bug in our payment reconciliation service affecting $2.3M in unmatched transactions, (2) a deadline for a PCI-DSS compliance audit deliverable in 5 days, and (3) a feature freeze deadline for a major client integration. My manager was on leave and I was the most senior engineer available.",
      task:
        "I needed to prioritize and execute on all three items without letting any of them fail, as each had significant business impact — revenue, compliance, and client relationship respectively.",
      action:
        "I used an urgency/impact matrix: the P1 bug was highest urgency (growing daily) and impact ($2.3M), so I tackled it first — spent 4 hours diagnosing and fixing a timezone conversion error in our reconciliation logic. For the PCI audit, I identified which deliverables I could complete (technical architecture docs) vs. delegate (network diagram to our DevOps engineer, access logs to our security team) — I wrote clear task descriptions and deadlines for each delegate. For the client integration, I identified the 3 critical-path items from the 8 remaining tasks and negotiated with the PM to defer the other 5 to post-launch.",
      result:
        "The P1 bug was resolved in 6 hours, recovering $2.3M in transactions. PCI audit deliverables were submitted 1 day early with all sections complete. The client integration launched on time with all critical features. My manager returned to zero escalations. I documented my prioritization decisions and shared them as a 'week in the life' case study for our team's on-call training."
    },
    tips: [
      "Show your framework for prioritization (urgency/impact), not just that you worked hard",
      "Delegation with clear task descriptions shows leadership, not just execution",
      "Negotiating scope (deferring 5 of 8 items) shows strategic thinking"
    ],
    followUps: [
      "What if two of the items had been equally urgent?",
      "How did you decide what to delegate vs. do yourself?",
      "How do you handle competing priorities when you cannot negotiate scope?"
    ]
  },
  {
    id: 42,
    question: "Describe a time you had to say no to a request to protect a more important goal.",
    category: "Time Management & Prioritization",
    companies: ["Amazon", "Apple", "Netflix"],
    leadershipPrinciple: "Deliver Results",
    seniority: "Senior",
    star: {
      situation:
        "Two weeks before our annual security audit at a healthcare platform, our Head of Product asked my team to build an emergency landing page redesign for a marketing campaign. The redesign was estimated at 5 engineering days. My team of 3 was fully allocated to audit preparation: fixing 7 security findings, writing evidence documentation, and conducting penetration testing.",
      task:
        "I needed to decline the product request without damaging the relationship or being perceived as uncooperative, while ensuring the security audit — which could result in loss of HIPAA certification if failed — was not compromised.",
      action:
        "I prepared a one-page impact analysis: if we pulled 1 engineer for the landing page, we would miss 3 of the 7 security findings, specifically the ones related to encryption at rest. I quantified the risk: a failed HIPAA audit would halt all customer onboarding for an estimated 6-8 weeks ($400K+ revenue impact). I presented this to the Head of Product along with three alternatives: (1) use a no-code tool (Webflow) for the landing page, (2) borrow an engineer from another team, or (3) delay the campaign by 3 weeks until post-audit. I helped evaluate the Webflow option and introduced them to a contractor from our vendor list.",
      result:
        "The Head of Product chose the Webflow approach and the landing page launched on time. We passed the HIPAA audit with zero findings. The Head of Product later told me she appreciated that I did not just say no but actively helped find an alternative. The experience led to a company policy of a 'security audit freeze' — no non-security work for my team in the 3 weeks before audits."
    },
    tips: [
      "Never say 'no' without quantifying WHY and offering alternatives",
      "Frame the trade-off in business terms the requester understands",
      "Actively helping find an alternative transforms 'no' into collaboration"
    ],
    followUps: [
      "What if the Head of Product had insisted despite your analysis?",
      "How do you maintain good relationships with stakeholders you regularly say no to?",
      "How do you decide your team's capacity threshold for taking on unplanned work?"
    ]
  },
  {
    id: 43,
    question: "Tell me about a time you had to cut scope to meet a deadline.",
    category: "Time Management & Prioritization",
    companies: ["Amazon", "Meta", "Google"],
    leadershipPrinciple: "Deliver Results",
    seniority: "SDE-2",
    star: {
      situation:
        "At a travel booking platform, our team committed to launching a hotel price comparison feature for the summer travel season — a hard deadline driven by peak booking traffic starting June 1. On May 10, with 3 weeks left, we had completed 60% of the planned scope. The remaining 40% included: real-time price alerts, multi-currency support, price history graphs, and a favorite hotels feature.",
      task:
        "I needed to decide which features to cut while ensuring the launch version was still valuable enough to justify the 'launch' label and capture the summer traffic opportunity.",
      action:
        "I mapped each remaining feature against two criteria: (1) impact on core user job ('find the cheapest hotel') and (2) engineering effort. Real-time alerts (high impact, high effort) and price history (medium impact, medium effort) got deferred. Multi-currency (high impact, low effort — mostly a display layer change) got kept. Favorite hotels (low impact, low effort) got kept as a quick win. I renegotiated the launch scope with the PM using this framework, got alignment, and communicated the revised scope to stakeholders with clear 'Phase 2' dates for deferred features.",
      result:
        "We launched on May 29, three days early. The launch version drove $890K in bookings in June (exceeding the $600K target). Multi-currency support accounted for 23% of bookings, validating the prioritization. Phase 2 features shipped in August, with price alerts becoming the #2 most-used feature. The PM adopted the impact/effort matrix as a standard tool for scope negotiations."
    },
    tips: [
      "Use a clear framework (impact/effort matrix) to make cuts feel objective, not arbitrary",
      "Always define 'Phase 2' with dates — it shows the cut features are deferred, not cancelled",
      "Quantify the outcome of the reduced scope to validate the trade-off"
    ],
    followUps: [
      "What if the PM had insisted on keeping all features?",
      "How did you communicate the scope cut to stakeholders outside engineering?",
      "In hindsight, would you have cut anything differently?"
    ]
  },
  {
    id: 44,
    question: "Describe a time you improved a team's efficiency or development process.",
    category: "Time Management & Prioritization",
    companies: ["Google", "Microsoft", "Amazon"],
    leadershipPrinciple: "Insist on the Highest Standards",
    seniority: "SDE-2",
    star: {
      situation:
        "At a B2B SaaS company, our team spent an average of 5.2 hours per week in meetings: daily standups (25 min), sprint planning (2 hrs), retrospectives (1 hr), design reviews (1 hr), and ad-hoc syncs. Engineers consistently complained that meeting overhead left insufficient focus time, and our sprint velocity had plateaued for 3 quarters.",
      task:
        "I proposed an experiment to reduce meeting overhead by 50% while maintaining alignment, planning quality, and team communication.",
      action:
        "I analyzed which meetings generated decisions vs. status updates and proposed: (1) Replace daily standups with async Slack check-ins using a bot (3 questions, takes 2 minutes), keeping a weekly 15-minute sync for blockers only, (2) Cut sprint planning from 2 hours to 1 hour by pre-writing story breakdowns in Notion (async review before the meeting), (3) Alternate retrospectives between full meetings and async Notion boards, (4) Make design reviews async-first with synchronous sessions only for contentious designs. We ran the experiment for 4 sprints.",
      result:
        "Meeting time dropped from 5.2 hours to 2.1 hours per week (60% reduction). Sprint velocity increased 22% in the first quarter. Engineer satisfaction survey showed 'focus time' scores go from 2.8/5 to 4.1/5. Interestingly, async design reviews surfaced more feedback because introverted team members contributed more in writing. The experiment became permanent policy and 4 other teams adopted the async-first approach."
    },
    tips: [
      "Framing it as a time-boxed experiment reduces resistance to change",
      "Distinguish between meetings that need real-time interaction and those that do not",
      "Measure both productivity metrics (velocity) and satisfaction metrics"
    ],
    followUps: [
      "What pushback did you get and how did you handle it?",
      "Were there any downsides to the async approach?",
      "How did you ensure async check-ins did not become just performative?"
    ]
  },
  {
    id: 45,
    question: "Tell me about a time you managed technical debt strategically.",
    category: "Time Management & Prioritization",
    companies: ["Amazon", "Netflix", "Google"],
    leadershipPrinciple: "Think Big",
    seniority: "Senior",
    star: {
      situation:
        "At an e-commerce company, our order processing monolith had accumulated 3 years of technical debt. Engineers estimated 6 months of dedicated work to 'fix everything.' Meanwhile, product had a 12-month roadmap with no room for a tech debt sprint. The symptoms: 45-minute build times, 300+ compiler warnings, and deployment failures 20% of the time.",
      task:
        "I needed a strategy to systematically reduce tech debt without pausing feature development, as the business could not afford a 6-month feature freeze.",
      action:
        "I categorized all tech debt into three buckets: (1) 'Taxes' — debt that slowed every engineer daily (build times, flaky tests) — 20% of total but 80% of daily pain, (2) 'Roadblocks' — debt in areas where upcoming features needed refactoring anyway, and (3) 'Dormant' — debt in stable code that was not actively causing harm. I proposed a '20% rule': every sprint, 20% of capacity went to Taxes. For Roadblocks, I worked with PMs to add refactoring as required pre-work in feature stories. Dormant debt was documented but explicitly deprioritized. I created a tech debt dashboard showing weekly progress.",
      result:
        "In 4 months (while delivering all planned features on time): build time dropped from 45 to 12 minutes, deployment failure rate went from 20% to 3%, and compiler warnings dropped from 300+ to 14. Feature delivery velocity actually increased 18% because engineers spent less time fighting the build and deployments. The 20% rule became a permanent engineering policy. The CTO used our approach in a conference talk about sustainable engineering practices."
    },
    tips: [
      "Categorization makes tech debt manageable — not all debt is equal",
      "The 20% rule is sustainable and does not require PM buy-in for a 'tech debt sprint'",
      "Showing velocity improvement proves that tech debt reduction accelerates features, not competes with them"
    ],
    followUps: [
      "How did you decide the 20% allocation — why not 10% or 30%?",
      "What happened with the 'dormant' debt — did it ever become active?",
      "How did you handle engineers who wanted to fix everything at once?"
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // TECHNICAL DECISION MAKING (5 stories)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 46,
    question: "Tell me about a significant architectural decision you made.",
    category: "Technical Decision Making",
    companies: ["Google", "Amazon", "Netflix"],
    leadershipPrinciple: "Think Big",
    seniority: "Senior",
    star: {
      situation:
        "At a real-time bidding (RTB) adtech company, our auction service was hitting latency limits: we needed to respond to bid requests in under 100ms, but our p99 was 180ms due to synchronous database lookups for advertiser budgets and targeting rules. We processed 500K bid requests per second and the problem was getting worse as we added more advertisers.",
      task:
        "I needed to redesign the auction service's data access pattern to meet the 100ms SLA while maintaining consistency of budget enforcement (overspending an advertiser's budget could cost us their contract).",
      action:
        "I evaluated three approaches: (1) in-memory cache with write-through to DB (fast but complex consistency), (2) move to Redis with pub/sub for budget updates (moderate speed, good consistency), (3) pre-load all active campaigns into a local in-process cache with a custom budget reservation protocol. I chose option 3 with a twist: each auction server 'reserved' a slice of each advertiser's budget locally (like a distributed token bucket), syncing back to the central DB every 5 seconds. I wrote an ADR (Architecture Decision Record) comparing all three options, built a prototype, and load-tested at 2x current traffic.",
      result:
        "P99 latency dropped from 180ms to 23ms. Budget accuracy was within 0.3% of real-time (the 5-second sync window). We could now handle 1.2M bid requests per second on the same infrastructure. Revenue per million impressions (RPM) increased 11% because we could evaluate more bid candidates within the latency window. The budget reservation protocol was patented. The ADR document became a template for all future architectural decisions."
    },
    tips: [
      "Show your evaluation of multiple options with clear trade-off analysis",
      "ADRs (Architecture Decision Records) demonstrate mature decision-making process",
      "Quantify the 'before vs after' on the specific metric that mattered (latency)"
    ],
    followUps: [
      "What happens if a server crashes with unreported budget reservations?",
      "Why did you reject the Redis approach?",
      "How did you handle the 0.3% budget inaccuracy with advertisers?"
    ]
  },
  {
    id: 47,
    question: "Describe a time you chose a boring technology over an exciting one.",
    category: "Technical Decision Making",
    companies: ["Amazon", "Google", "Apple"],
    leadershipPrinciple: "Frugality",
    seniority: "SDE-2",
    star: {
      situation:
        "When designing a new event processing pipeline at a logistics company, two engineers pushed for Apache Kafka Streams with a complex event-sourcing architecture. The team was excited about the technology. But our use case was straightforward: process 10K events/hour from IoT sensors (package scans), transform them, and write to a PostgreSQL warehouse. Our team of 5 had no Kafka operational experience.",
      task:
        "I needed to make the case for a simpler solution without being labeled as 'not innovative' or dismissive of the team's enthusiasm for learning new technology.",
      action:
        "I created a comparison document with three columns: Kafka Streams, AWS SQS + Lambda, and a simple PostgreSQL LISTEN/NOTIFY with a worker process. For each, I estimated: implementation time, operational complexity (on-call burden), cost, team ramp-up time, and scalability ceiling. The PostgreSQL approach could handle 100K events/hour (10x our need) with zero new infrastructure. I proposed we use the PostgreSQL approach now and set a 'scaling trigger' at 50K events/hour to re-evaluate. I also proposed using the saved engineering time to build better monitoring and alerting.",
      result:
        "The team agreed after seeing the comparison. We shipped the pipeline in 2 weeks (vs. estimated 8 weeks for Kafka). Monthly infrastructure cost was $0 incremental (PostgreSQL was already running) vs. estimated $1,200/month for Kafka. The system handled 3x traffic growth over 18 months without hitting the scaling trigger. On-call incidents for the pipeline: zero in 12 months. The saved 6 weeks were spent building a real-time tracking dashboard that became a key sales differentiator."
    },
    tips: [
      "Frame boring technology as a strategic choice, not a lack of ambition",
      "The 'scaling trigger' approach acknowledges future needs without premature optimization",
      "Show what you built with the time you saved — it makes the trade-off tangible"
    ],
    followUps: [
      "How did the engineers who wanted Kafka react?",
      "At what point would you have chosen Kafka?",
      "How do you balance team learning/growth with pragmatic technology choices?"
    ]
  },
  {
    id: 48,
    question: "Tell me about a time you had to choose between speed and quality.",
    category: "Technical Decision Making",
    companies: ["Meta", "Amazon", "Netflix"],
    leadershipPrinciple: "Bias for Action",
    seniority: "SDE-2",
    star: {
      situation:
        "At a cybersecurity startup, we discovered a critical vulnerability in our authentication service — a JWT token validation bypass that could allow unauthorized access to customer accounts. The fix was conceptually simple but our auth service had zero tests (legacy code from our MVP). Writing tests first would take 3 days; deploying the fix without tests could be done in 4 hours but risked regression.",
      task:
        "I needed to protect our customers immediately while not introducing new bugs in the most security-critical part of our system.",
      action:
        "I chose a 'fix fast, test immediately after' approach with safeguards. I wrote the fix (4 hours), had it reviewed by two engineers simultaneously, deployed it behind a feature flag to 1% of traffic for 1 hour to monitor for regressions, then rolled to 100%. In parallel, I started writing the test suite. Over the next 3 days, I wrote 47 tests covering the auth service's critical paths. I also set up a security-specific CI pipeline that blocks all auth-related PRs without test coverage.",
      result:
        "The vulnerability was patched within 5 hours of discovery, with zero regressions during canary testing. No customer accounts were compromised. The 47 tests caught 2 additional edge case bugs during the testing phase. The security CI pipeline prevented 4 risky auth changes in the next quarter. Our security team established a 'golden hour' protocol for critical vulnerabilities based on this approach: patch first with canary, test within 72 hours."
    },
    tips: [
      "Show nuance — it is not always speed OR quality, sometimes it is speed THEN quality",
      "Feature flags and canary deploys are your safety net for speed decisions",
      "Turn the incident into a lasting process improvement"
    ],
    followUps: [
      "What if the canary deployment had shown regressions?",
      "How did you decide the 1% canary was sufficient to catch issues?",
      "How do you prevent the 'we will add tests later' promise from being forgotten?"
    ]
  },
  {
    id: 49,
    question: "Describe a time you evaluated and selected a third-party vendor or tool.",
    category: "Technical Decision Making",
    companies: ["Amazon", "Microsoft", "Google"],
    leadershipPrinciple: "Frugality",
    seniority: "Senior",
    star: {
      situation:
        "At a healthcare company, our custom-built monitoring system was consuming 30% of our platform team's time (2 of 6 engineers). We needed to evaluate third-party observability platforms (Datadog, New Relic, Grafana Cloud, and self-hosted Prometheus/Grafana) for our 85-service infrastructure generating 2TB of telemetry data per day.",
      task:
        "I was asked to lead the evaluation and make a recommendation that balanced cost, capability, operational overhead, and vendor lock-in risk for a decision that would last 3-5 years.",
      action:
        "I created a structured evaluation framework: (1) Built a weighted scoring matrix with 12 criteria across 4 categories (functionality, cost, operations, risk), (2) Ran 2-week proof-of-concepts with our top 2 candidates (Datadog and Grafana Cloud) using real production data, (3) Interviewed 4 companies of similar size about their experience with each tool, (4) Modeled 3-year TCO including engineering time at $180K/engineer. I presented findings to engineering leadership with a clear recommendation and migration plan.",
      result:
        "We chose Grafana Cloud: 60% cheaper than Datadog at our scale ($8K/month vs $20K/month), 85% feature parity for our use cases, and lower lock-in risk due to open-source compatibility. Migration took 6 weeks. We freed up 1.5 engineers from monitoring maintenance (saving $270K/year in engineering time). Mean time to detection (MTTD) for incidents improved from 12 minutes to 3 minutes with better alerting. The evaluation framework was reused for 3 subsequent vendor decisions."
    },
    tips: [
      "Structured evaluation frameworks remove politics from vendor decisions",
      "Include TCO with engineering time — the sticker price is never the real cost",
      "Reference checks with similar companies provide insights no demo can"
    ],
    followUps: [
      "What features did Grafana Cloud lack compared to Datadog, and how did you mitigate?",
      "How did you handle the migration without losing visibility during the transition?",
      "How do you re-evaluate the decision as the company and tool both evolve?"
    ]
  },
  {
    id: 50,
    question: "Tell me about a time you had to make a reversible vs irreversible decision.",
    category: "Technical Decision Making",
    companies: ["Amazon", "Google", "Netflix"],
    leadershipPrinciple: "Bias for Action",
    seniority: "Senior",
    star: {
      situation:
        "At a data platform company, we faced a critical architectural choice: adopt a new database (CockroachDB) for our multi-region customer data, or invest in sharding our existing PostgreSQL setup. Both had significant trade-offs. The team was split 50/50 and had been debating for 3 weeks, losing momentum on feature development.",
      task:
        "I needed to break the decision deadlock by reframing the choice and identifying which aspects were reversible (experiment quickly) vs. irreversible (require careful analysis).",
      action:
        "I mapped the decision into reversible and irreversible components. Irreversible: data model changes (if we adopted CockroachDB's specific features like REGIONAL BY ROW). Reversible: the database engine itself (we could migrate back if CockroachDB did not work, as long as we used standard SQL). I proposed: (1) keep the data model database-agnostic using an ORM abstraction layer (protecting the irreversible part), (2) run CockroachDB for a single non-critical service for 6 weeks as a production trial (fast decision on the reversible part), (3) set specific go/no-go criteria before the trial (latency, operational complexity, cost). This reframing turned one big irreversible decision into one small reversible experiment.",
      result:
        "The team aligned within 1 day of the reframing. The 6-week trial revealed that CockroachDB's multi-region latency was excellent (p99 of 45ms vs 180ms for our sharded PostgreSQL prototype) but operational complexity was higher than expected. We decided to proceed with CockroachDB for multi-region services only and keep PostgreSQL for single-region ones. The ORM abstraction layer meant we could change our mind later. Total decision-to-action time: 1 week (vs. 3 weeks of circular debate). The reversible/irreversible framework became our standard approach for architectural decisions."
    },
    tips: [
      "The reversible/irreversible framework is directly from Amazon's leadership principles — know it well",
      "Reframing a big decision into smaller experiments breaks deadlocks",
      "Define go/no-go criteria before the experiment to avoid post-hoc rationalization"
    ],
    followUps: [
      "What specific go/no-go criteria did you set?",
      "How did you handle the operational complexity concerns long-term?",
      "What is an example of a truly irreversible decision you have made?"
    ]
  }
];

// ─── Validate the data ─────────────────────────────────────────
const categories = {};
const seniorities = {};
const companies = new Set();
const principles = new Set();

stories.forEach((story, index) => {
  const errors = [];

  if (!story.id) errors.push("missing id");
  if (!story.question) errors.push("missing question");
  if (!story.category) errors.push("missing category");
  if (!story.companies || !story.companies.length) errors.push("missing companies");
  if (!story.leadershipPrinciple) errors.push("missing leadershipPrinciple");
  if (!story.seniority) errors.push("missing seniority");
  if (!story.star) errors.push("missing star");
  if (!story.star?.situation) errors.push("missing star.situation");
  if (!story.star?.task) errors.push("missing star.task");
  if (!story.star?.action) errors.push("missing star.action");
  if (!story.star?.result) errors.push("missing star.result");
  if (!story.tips || story.tips.length < 2) errors.push("need at least 2 tips");
  if (!story.followUps || story.followUps.length < 2) errors.push("need at least 2 followUps");

  if (errors.length > 0) {
    console.error(`Story ${index + 1} (id: ${story.id}): ${errors.join(", ")}`);
    process.exit(1);
  }

  categories[story.category] = (categories[story.category] || 0) + 1;
  seniorities[story.seniority] = (seniorities[story.seniority] || 0) + 1;
  story.companies.forEach((c) => companies.add(c));
  principles.add(story.leadershipPrinciple);
});

// ─── Write the output ──────────────────────────────────────────
const outPath = path.join(__dirname, "..", "public", "content", "star-stories.json");
fs.writeFileSync(outPath, JSON.stringify(stories, null, 2), "utf-8");

console.log(`\nGenerated ${stories.length} STAR behavioral interview stories`);
console.log(`Output: ${outPath}\n`);
console.log("Categories:");
Object.entries(categories)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));
console.log("\nSeniority distribution:");
Object.entries(seniorities)
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, count]) => console.log(`  ${s}: ${count}`));
console.log(`\nCompanies covered: ${[...companies].sort().join(", ")}`);
console.log(`Leadership principles: ${[...principles].sort().join(", ")}`);
console.log(`\nFile size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
