#!/usr/bin/env python3
"""Generate full lesson content for 4 system design topics."""
import json, pathlib

OUT = pathlib.Path("/Users/racit/PersonalProject/guru-sishya/public/content/system-design-fundamentals.json")

# ── Helpers ───────────────────────────────────────────────────────────────────

def q(question, fmt, diff, bloom, opts, ans, expl):
    return {"question": question, "format": fmt, "difficulty": diff,
            "bloomLabel": bloom, "options": opts, "correctAnswer": ans, "explanation": expl}

def session(num, title, pareto, diff, mins, hook, rwm, objectives, content, takeaways, activities, resources, review, success):
    return {"sessionNumber": num, "title": title, "paretoJustification": pareto,
            "difficulty": diff, "estimatedMinutes": mins, "hookQuestion": hook,
            "realWorldMotivation": rwm, "objectives": objectives, "content": content,
            "keyTakeaways": takeaways, "activities": activities, "resources": resources,
            "reviewQuestions": review, "successCriteria": success}

def level(n, name, dl, desc, skills, mp_title, mp_desc, mp_hrs, plateaus, hrs, prereqs):
    return {"level": n, "name": name, "dreyfusLabel": dl, "description": desc,
            "observableSkills": skills,
            "milestoneProject": {"title": mp_title, "description": mp_desc, "estimatedHours": mp_hrs},
            "commonPlateaus": plateaus, "estimatedHours": hrs, "prerequisites": prereqs}

def resource(title, author, cat, just, bf, time, cost, conf, url=None):
    r = {"title": title, "author": author, "category": cat, "justification": just,
         "bestFor": bf, "estimatedTime": time, "cost": cost, "confidence": conf}
    if url: r["url"] = url
    return r

# ═══════════════════════════════════════════════════════════════════════════════
# TOPIC 1 — CDN
# ═══════════════════════════════════════════════════════════════════════════════

CDN_S1_CONTENT = """\
## The Problem CDNs Solve

Consider a web server running in AWS us-east-1 (Northern Virginia). When a user in Tokyo loads your homepage, their browser must send an HTTP request that travels approximately 14,000 kilometres — crossing the Pacific Ocean via undersea fibre cables — and wait for the response to make the same journey back. That round-trip adds 150–200 milliseconds of latency before a single byte of your page renders. For a page that makes 50 requests, this compounds into seconds of added wait time.

Now multiply this across millions of global users hitting your single origin. Two problems compound simultaneously: **network latency** for distant users and **crushing origin load** as every request hits your servers. A viral event, a product launch, or even predictable daily peaks can overwhelm an origin that wasn't designed to serve the world directly.

A **Content Delivery Network** (CDN) solves both problems by distributing your content across a global network of **Points of Presence (PoPs)** — edge servers strategically positioned in major cities and internet exchange points worldwide. Instead of reaching your Virginia origin, a Tokyo user's request is served by a CDN edge node in Tokyo, reducing round-trip latency from 200ms to under 5ms. Simultaneously, your origin is protected because edge nodes cache and serve content, forwarding to origin only on cache misses.

The largest CDNs — Cloudflare, Akamai, and AWS CloudFront — collectively operate hundreds of PoPs across every continent, handling trillions of requests per day. Netflix, which serves 15% of global internet traffic, relies entirely on CDN infrastructure. Without it, their origin infrastructure would need to be 10–20x larger to handle the same load.

---

## The CDN Request Lifecycle

Understanding exactly what happens when a user requests a cached resource is essential for debugging CDN issues and explaining the architecture in interviews.

```mermaid
sequenceDiagram
    participant U as User (Tokyo)
    participant DNS as Anycast DNS
    participant E as Edge PoP (Tokyo)
    participant S as Origin Shield (US-West)
    participant O as Origin (Virginia)

    U->>DNS: resolve cdn.example.com
    DNS-->>U: nearest PoP IP (via Anycast)
    U->>E: GET /static/logo.png
    alt Cache HIT (object in edge cache)
        E-->>U: 200 OK  [X-Cache: HIT, Age: 3600]
    else Cache MISS
        E->>S: GET /static/logo.png
        alt Shield HIT (object in shield cache)
            S-->>E: 200 OK [X-Cache: HIT]
            E-->>U: 200 OK [X-Cache: MISS]
        else Shield MISS (nobody has it)
            S->>O: GET /static/logo.png
            O-->>S: 200 OK + Cache-Control headers
            S-->>E: 200 OK (now cached in shield)
            E-->>U: 200 OK (now cached in edge)
        end
    end
```

**Diagnosing a request via response headers:**
- `X-Cache: HIT` — the edge node served from its local cache (fastest path)
- `X-Cache: MISS` — the edge had to fetch from an upstream layer
- `Age: 3600` — the object has been in cache for 3600 seconds
- `CF-Cache-Status: HIT/MISS/DYNAMIC` — Cloudflare's equivalent
- `Via: 1.1 cloudfront.net (CloudFront)` — confirms request passed through CloudFront

When you see `Age: 0` on an `X-Cache: HIT` response, the object was just cached (first hit after a miss). An `Age` value close to the `max-age` means the object is about to expire.

---

## Cache-Control: The Most Important CDN Header

The `Cache-Control` response header from your origin tells CDN edge nodes exactly how long to cache content and under what conditions. Mastering it eliminates most CDN-related bugs.

```http
# Static assets with content hash in filename — cache forever, never change
Cache-Control: public, max-age=31536000, immutable

# HTML pages — CDN caches 60s, serve stale for up to 1h while refreshing in background
Cache-Control: public, s-maxage=60, stale-while-revalidate=3600

# API responses — CDN caches 30s, browsers must not cache at all
Cache-Control: public, s-maxage=30, no-store

# Authenticated/private content — NEVER let CDN cache this
Cache-Control: private, no-store
```

The key distinction: `s-maxage` sets TTL specifically for **shared caches** (CDNs, proxies) and overrides `max-age` for them. Set `max-age=3600, s-maxage=60` and browsers will cache for 1 hour while the CDN refreshes every 60 seconds. This separation gives you fine-grained control: short CDN TTL for freshness, longer browser TTL to reduce repeat requests.

The `immutable` directive tells browsers that a resource will never change for its entire TTL — skip the conditional request on reload. Only use this for content-addressed URLs (with hash in filename) where you guarantee the URL changes if content changes.

---

## Anycast Routing: How Users Find the Nearest PoP

CDNs advertise the **same IP address from every PoP simultaneously** using BGP Anycast. When your DNS resolves `cdn.example.com`, it returns a single IP address. The internet's BGP routing infrastructure automatically directs your packets to the topologically nearest announcement of that IP — typically the nearest PoP.

This is fundamentally different from GeoDNS, which returns different IP addresses based on the requester's location. Anycast works at the routing layer: your ISP's BGP routers know the shortest path to each IP prefix announcement, so they route your packets to the nearest PoP without any DNS trickery.

Practical implication: a user in Frankfurt might actually route to the Amsterdam PoP if their ISP has better peering with that PoP. Topology and peering agreements matter more than physical distance.

---

## Cache Hit Ratio: Your Primary CDN Metric

```
Cache Hit Ratio (CHR) = Cache Hits / (Cache Hits + Cache Misses)
```

A CHR of 95% means your origin handles only 5% of traffic. On 1,000,000 requests per day, that's 50,000 origin hits instead of 1,000,000 — a 20x reduction in origin load, directly translating to 20x lower server costs and 20x more headroom before your origin saturates.

**What destroys your cache hit ratio:**

1. **Short TTLs on rarely-changing content** — setting 60s TTL on images that change monthly means constant cache misses
2. **Unbounded query strings** — every unique combination of `?sort=price&page=1&color=blue` is a separate cache key. Normalise or strip irrelevant query parameters.
3. **`Vary: User-Agent`** — User-Agent has thousands of unique values; the CDN creates a separate cache entry for each, making nearly every request a miss
4. **Cookie-based variation** — if your origin varies responses based on cookies, the CDN cannot cache shared responses. Separate personalised and cacheable content into different paths.
5. **Too many unique paths** — if your URL space is unbounded (e.g., `/profile/{user_id}`), static caching won't help

**Measuring CHR:** Both CloudFront and Cloudflare expose CHR in their analytics dashboards. Monitor it per path pattern, not just overall — a low-CHR path might be dragging down your aggregate numbers."""

CDN_S1_REVIEW = [
    "What is the difference between a cache HIT and MISS, and which is better for your origin?:::HIT means the CDN served from its local cache without contacting origin. MISS means it fetched from upstream. HITs are better — they reduce origin load and user latency.",
    "What does s-maxage do and how does it differ from max-age?:::s-maxage sets TTL for shared caches (CDNs/proxies) specifically. max-age applies to all caches including browsers. CDNs use s-maxage when present. This lets you set different TTLs for CDN vs browser.",
    "Why does Vary: User-Agent destroy cache hit ratio?:::The CDN creates a separate cache entry per unique Vary header value. User-Agent has thousands of distinct values, making almost every request a miss. Only vary on headers that genuinely produce different content.",
    "Describe the full request path for a cache miss on a CDN with origin shield enabled.:::User DNS resolves via Anycast to nearest PoP. Edge checks cache — miss. Forwards to origin shield. If shield hits, responds to edge. If shield also misses, shield fetches from origin, caches at both shield and edge, then responds to user.",
]

CDN_S2_CONTENT = """\
## Cache Invalidation: The Hard Problem

Phil Karlton famously said there are only two hard things in computer science: cache invalidation and naming things. In CDN context, getting invalidation wrong means users see stale, incorrect, or even broken content — sometimes for years if you set an infinite TTL carelessly. There are four main strategies, and choosing the right one for each content type is a core system design skill.

### Strategy 1: TTL Expiry — Let It Rot

The simplest approach: set a TTL and wait for cached objects to expire naturally. Zero operational complexity, zero API calls, zero cost.

```
Cache-Control: public, s-maxage=3600
```

After 3600 seconds, every edge node's cached copy expires. The next request from any user triggers a cache miss and fetches the fresh version. This approach trades **immediacy for simplicity** — content can be stale for up to the full TTL duration after an update.

**When to use TTL expiry:** Any content where slight staleness is acceptable. News article comment counts (showing 5 minutes old data is fine). Sports scores. Product listing counts. Weather data. The key question is: if a user sees content that is N seconds old, is that a problem? If N equals your TTL and the answer is "no," use this strategy.

**Setting the right TTL:** Match TTL to your update frequency. Content that changes hourly should have a 5–10 minute TTL, giving you most of the caching benefit while limiting staleness. Content that changes daily can have a 1–6 hour TTL.

### Strategy 2: Versioned / Fingerprinted URLs — The Gold Standard

Embed a content hash in the filename. When content changes, the hash changes, the URL changes, and the old cached version is automatically bypassed — no invalidation API call needed, ever.

```html
<!-- Naive approach — same URL, stale cache on update -->
<script src="/app.js"></script>

<!-- Content-addressed — changing content changes URL automatically -->
<script src="/app.a3f9c2b4.js"></script>
<link rel="stylesheet" href="/styles.d8e2f1a3.css">
```

Modern build tools (webpack, Vite, esbuild) generate these hashed filenames automatically. The workflow:
1. Content changes → build tool generates new hash → new filename
2. Old URL still exists in CDN cache (no problem — no one requests it)
3. New URL is a cache miss on first request → fetched from origin and cached
4. HTML entry point references new URLs

With versioned URLs, you can safely set `max-age=31536000, immutable` — the CDN caches forever, users always get fresh content because the URL changes with the content.

**Limitation:** The HTML entry point (index.html) itself cannot be versioned this way — it must be requested by a known URL. HTML should have a short TTL (60–300 seconds) or use API invalidation on deploy.

### Strategy 3: API Invalidation — Instant Purge

When you need immediate effect, call the CDN's invalidation API to purge cached objects from all edge nodes. This is the right tool for emergencies and for invalidating the HTML entry point on deploy.

```python
# CloudFront invalidation via boto3
import boto3
cf = boto3.client('cloudfront')
cf.create_invalidation(
    DistributionId='E1234567890',
    InvalidationBatch={
        'Paths': {'Quantity': 2, 'Items': ['/index.html', '/manifest.json']},
        'CallerReference': 'deploy-20240322-001'
    }
)
```

```bash
# Cloudflare: single file purge
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \\
  -H "Authorization: Bearer {token}" \\
  -H "Content-Type: application/json" \\
  -d '{"files":["https://example.com/index.html"]}'
```

**Cost and limits:** CloudFront charges $0.005 per 1,000 invalidation paths (first 1,000/month are free). A wildcard path like `/images/*` counts as one path. Cloudflare charges nothing for cache purges on paid plans. Both propagate invalidations globally within seconds to minutes.

**Warning:** Do not use API invalidation as your primary delivery mechanism — it defeats the purpose of caching. Use it surgically: only for emergency corrections and HTML deploy updates. If you find yourself invalidating more than a few hundred paths per deploy, redesign around versioned URLs.

### Strategy 4: Surrogate Keys / Cache Tags

The most powerful pattern for content-rich applications. Tag each cached response with one or more logical identifiers. When data changes, purge all responses sharing that tag atomically in a single API call.

```http
# Origin response headers — tag this response with logical identifiers
Surrogate-Key: product-42 category-electronics user-promo-active
Cache-Tag: product-42,category-electronics
```

```bash
# Purge ALL cached pages tagged with product-42 across all PoPs instantly
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \\
  -H "Authorization: Bearer {token}" \\
  -d '{"tags":["product-42"]}'
```

**E-commerce example:** Product #42 (a laptop) changes its price. Without surrogate keys, you'd need to enumerate every URL that shows this laptop — product page, category pages (Electronics, Laptops, Sale), search results for "laptop," recommendation carousels on homepage, etc. With surrogate keys, every page that renders product #42 includes `Cache-Tag: product-42` in its response. When price changes: one API call, all pages updated instantly.

Fastly pioneered this with `Surrogate-Key` headers. Cloudflare implements it as `Cache-Tag`. CloudFront requires custom implementation.

---

## Origin Shield Architecture

Origin shield is a mid-tier caching layer positioned between your edge PoPs and your origin server. It addresses a fundamental problem with CDN at scale: cache miss amplification.

```mermaid
graph TD
    subgraph "Edge PoPs (400+ globally)"
      E1[Tokyo PoP]
      E2[London PoP]
      E3[Sao Paulo PoP]
      E4[Sydney PoP]
      E5[... 396 more]
    end
    subgraph "Origin Shield (1 node)"
      S[Shield Cache<br/>us-east-1]
    end
    O[Origin Server]

    E1 --> S
    E2 --> S
    E3 --> S
    E4 --> S
    E5 --> S
    S --> O
```

**Without origin shield:** A popular product page TTL expires simultaneously across 400 PoPs. All 400 PoPs get a request before anyone re-caches the object. Each PoP independently fetches from origin. Origin receives 400 concurrent requests for the same object — a thundering herd that can overwhelm your origin.

**With origin shield:** All 400 PoP misses route to the origin shield. The shield also missed (first request after TTL expiry), so it makes exactly **one** request to origin. It receives the response, caches it, and fans it out to all 400 waiting PoPs. Origin receives 1 request instead of 400.

The result in practice: 60–90% reduction in origin requests. Netflix reports origin shield reduces their origin load by over 95%.

**Enabling origin shield:** CloudFront — enable "Origin Shield" in your distribution's origin settings, selecting the AWS region closest to your origin. Cloudflare — "Tiered Cache" (free, automatic) with optional Argo Smart Routing for intelligent path selection. Fastly — "Shielding" with configurable shield node location.

---

## Push vs Pull CDNs: Choosing the Right Model

```
| Dimension         | Pull CDN                             | Push CDN                          |
|-------------------|--------------------------------------|-----------------------------------|
| Mechanism         | Edge fetches from origin on miss     | You upload to CDN storage upfront |
| First-user latency| Higher (cold start miss)             | Zero (pre-positioned)             |
| Best content type | Web assets, APIs, typical web content| Large binary files                |
| Update workflow   | Deploy origin, CDN auto-refreshes    | Must push to CDN on every update  |
| Operational burden| Low                                  | High                              |
| Examples          | CloudFront, Cloudflare, Fastly       | S3+CloudFront, Akamai NetStorage  |
```

**When to choose push CDN:** You're a game studio releasing a 50 GB patch update. Millions of players will attempt to download it within minutes of release. You know exactly what content will be demanded and when. Pre-positioning the file to every PoP before release eliminates cold-start latency entirely and prevents any first-user miss. The operational overhead of pushing 50 GB to hundreds of PoPs is justified.

For virtually all other use cases — websites, APIs, media streaming, app assets — pull CDN is simpler, more flexible, and correct.

---

## Cache Stampede Prevention

When a popular object's TTL expires, many concurrent requests arrive before any of them re-populate the cache. All of them miss, all of them fetch from origin simultaneously — the thundering herd problem.

**Solution 1: stale-while-revalidate** — serve the stale object immediately to all concurrent requests while one background request asynchronously refreshes the cache. This is the recommended solution for web content.

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=3600
```

Users see content up to 60 minutes stale during the background refresh, but they never experience a cache miss latency spike.

**Solution 2: Request coalescing** — the CDN holds all concurrent miss requests in a queue, makes exactly one upstream request, and fans the single response out to all waiting requests. Most CDNs implement this automatically, especially when origin shield is enabled. This collapses the thundering herd at the CDN layer rather than at your origin.

**Solution 3: Probabilistic early expiration (XFetch algorithm)** — instead of all copies of an object expiring at exactly the same TTL, each edge node independently introduces a small random offset that increases as the TTL approaches. This staggers the expiry events across time, preventing the synchronised stampede. Used internally by Varnish and some CDN implementations."""

CDN_S2_REVIEW = [
    "A news site updates its homepage every 5 minutes. What Cache-Control strategy should you use?:::s-maxage=300 with stale-while-revalidate=60. CDN caches 5 minutes; serves stale for up to 60s while refreshing in background. Prevents thundering herd on expiry. HTML is not fingerprinted so infinite TTL is not safe.",
    "What are surrogate keys and give a concrete e-commerce use case?:::Surrogate keys (Cache-Tag on Cloudflare) are identifiers attached to cached responses via headers. You can purge all responses sharing a tag with one API call. Use case: when product #42 stock changes, purge tag 'product-42' to instantly refresh the product page, category listing, and search results simultaneously.",
    "Without origin shield, what happens when a cached object expires and 10,000 users request it simultaneously?:::Cache stampede / thundering herd — all PoPs miss simultaneously and each sends an independent request to origin. With 400 PoPs, origin receives ~400 concurrent requests for the same object. Origin shield collapses these into one request.",
    "When would you choose push CDN over pull CDN?:::Push CDN when: you have large files (50+ GB) like game patches or OS updates; you know in advance the content will be accessed by a massive simultaneous audience on a specific date; zero cold-start latency for the first user is critical.",
]

cdn = {
    "topic": "Content Delivery Networks (CDN)",
    "category": "System Design",
    "cheatSheet": """\
# CDN Cheat Sheet

## Key Metrics
- **Cache Hit Ratio (CHR)** = Hits / Total Requests — target >90% for static assets
- **TTFB (Time to First Byte)** — CDN edge latency vs origin latency
- **Origin RPS** — requests per second hitting origin (lower = better)

## Cache-Control Quick Reference
```
public, max-age=31536000, immutable       # static assets with hash
public, s-maxage=60, stale-while-revalidate=3600  # HTML pages
public, s-maxage=30, no-store            # API (CDN caches, browser doesn't)
private, no-store                         # authenticated content
```

## Invalidation Decision Tree
1. Static asset? → Use versioned URL + immutable. No invalidation needed.
2. Content with known relationships? → Use surrogate keys / cache tags.
3. Emergency purge? → API invalidation.
4. Everything else? → Short TTL + stale-while-revalidate.

## Push vs Pull
- **Pull**: edge fetches on miss. Default for all web content.
- **Push**: pre-upload to CDN. Use for large files with predictable massive demand.

## CloudFront Key Facts
- 400+ PoPs; Origin Shield = mid-tier cache layer
- Signed URLs/cookies for private content
- Lambda@Edge for request/response manipulation at edge
- Invalidation: first 1000 paths/month free, then $0.005/1000

## Cloudflare Key Facts
- Anycast network; Tiered Cache = built-in origin shield
- Workers (V8 isolates) run at edge, <1ms cold start
- Cache-Tag for surrogate key purging
- R2 object storage = no egress fees

## Golden Rules
1. Fingerprint static assets — infinite TTL, zero invalidation
2. Enable origin shield — 60-90% origin load reduction
3. Never cache authenticated responses at CDN
4. Monitor CHR per path, not just overall
5. Use stale-while-revalidate to prevent thundering herd""",
    "resources": [
        resource("CloudFront Developer Guide", "AWS", "docs",
                 "Primary reference for CloudFront behaviours, cache policies, and origin shield",
                 "Engineers deploying CloudFront", "3 hours", "Free", "HIGH",
                 "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowCloudFrontWorks.html"),
        resource("Cloudflare Learning Center — CDN", "Cloudflare", "docs",
                 "Vendor-neutral CDN concept explanations written for practitioners",
                 "Conceptual understanding", "2 hours", "Free", "HIGH",
                 "https://www.cloudflare.com/learning/cdn/what-is-a-cdn/"),
        resource("Web Performance in Action", "Jeremy Wagner", "books",
                 "In-depth coverage of Cache-Control headers and asset delivery pipeline",
                 "Frontend engineers optimising delivery", "8 hours", "~$35", "HIGH"),
    ],
    "ladder": {"levels": [
        level(1, "Novice", "Novice",
              "Understands what a CDN is and why websites use one",
              ["Explains cache hit vs miss", "Reads Cache-Control headers", "Knows CDN reduces latency by serving from edge"],
              "Static Site CDN Setup",
              "Deploy a static HTML/CSS/JS site behind Cloudflare free tier; verify cache headers in DevTools",
              2, ["Confusing browser cache with CDN cache", "Not understanding TTL expiry"], 4,
              ["Basic HTTP knowledge", "DNS fundamentals"]),
        level(2, "Advanced Beginner", "Advanced Beginner",
              "Configures CDN behaviours for different content types and understands invalidation",
              ["Sets up path-based cache behaviours", "Implements cache invalidation via API", "Explains push vs pull trade-offs"],
              "Multi-Behaviour CloudFront Distribution",
              "Create a CloudFront distribution with separate behaviours for /api/*, /static/*, /* with appropriate TTLs",
              6, ["Over-invalidating cache", "Forgetting Vary header impact"], 10,
              ["HTTP caching fundamentals", "Basic AWS or Cloudflare experience"]),
        level(3, "Competent", "Competent",
              "Architects CDN strategy for production systems including origin shield and edge logic",
              ["Designs origin shield topology", "Implements surrogate key invalidation", "Writes edge functions for A/B testing"],
              "Edge-Computed Personalisation",
              "Use Cloudflare Workers or Lambda@Edge to serve personalised content at edge without hitting origin",
              15, ["Not accounting for cache stampede on cold start", "Missing geo-routing edge cases"], 30,
              ["CDN configuration experience", "Basic serverless knowledge"]),
        level(4, "Proficient", "Proficient",
              "Optimises CDN for cost and performance at scale; troubleshoots complex caching bugs",
              ["Analyses CHR per path and drives improvements", "Implements cache stampede protection", "Designs multi-CDN strategy"],
              "Cache Hit Ratio Improvement Sprint",
              "Audit a production CDN, identify top cache-miss contributors, implement fixes, measure improvement",
              20, ["Single-CDN lock-in risk", "Cache tag sprawl causing management overhead"], 60,
              ["Production CDN operations experience", "Observability tooling familiarity"]),
        level(5, "Expert", "Expert",
              "Designs CDN architecture for global platforms; evaluates vendor trade-offs at enterprise scale",
              ["Architects tiered CDN with custom origin shield topologies", "Designs cache-consistent invalidation", "Evaluates build-vs-buy for custom CDN"],
              "Multi-CDN Failover Platform",
              "Design and prototype a multi-CDN routing layer using DNS-based failover and real-time performance telemetry",
              60, ["Assuming one CDN fits all content types", "Underestimating invalidation consistency lag"], 120,
              ["Proficient CDN experience", "Distributed systems knowledge", "BGP/Anycast networking"]),
    ]},
    "plan": {
        "overview": "Master CDN architecture from first principles to production-grade design: edge caching mechanics, origin shield, cache invalidation strategies, and CloudFront/Cloudflare implementations.",
        "skippedTopics": "CDN billing details, video streaming protocols (HLS/DASH internals), WAF rule syntax",
        "sessions": [
            session(1,
                "How CDNs Work: Edge Caching and the Request Lifecycle",
                "Cache hit/miss flow and TTL mechanics cover 80% of CDN interview questions and day-to-day debugging.",
                "beginner", 45,
                "Netflix serves 15% of global internet traffic. How can their servers possibly handle that — and why don't your video requests actually reach Netflix's data centers?",
                "Every major product uses a CDN. Understanding request flow through edge nodes is essential for designing scalable systems and debugging latency issues.",
                ["Explain the CDN request lifecycle from DNS lookup to content delivery",
                 "Define cache hit, cache miss, and cache fill",
                 "Write Cache-Control headers for static assets, HTML, and API responses",
                 "Explain what a PoP is and how Anycast routing works"],
                CDN_S1_CONTENT,
                ["CDNs solve latency AND origin load simultaneously via edge caching",
                 "Request path: User -> Anycast DNS -> Edge PoP -> Origin Shield -> Origin",
                 "s-maxage controls CDN TTL independently of browser TTL",
                 "Cache Hit Ratio is the primary operational CDN metric; target >90% for static assets",
                 "Content-addressed URLs allow infinite TTL and eliminate invalidation complexity"],
                [{"description": "Read MDN Cache-Control docs; identify which directives apply to CDN vs browser", "durationMinutes": 10},
                 {"description": "Inspect Cache-Control and X-Cache headers on 3 major websites in DevTools", "durationMinutes": 10},
                 {"description": "Draw the full request lifecycle from memory for a cache miss scenario", "durationMinutes": 10},
                 {"description": "Answer review questions", "durationMinutes": 15}],
                [{"title": "Cache-Control — MDN", "type": "docs", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control"},
                 {"title": "Cloudflare: What is a CDN?", "type": "article", "url": "https://www.cloudflare.com/learning/cdn/what-is-a-cdn/"}],
                CDN_S1_REVIEW,
                "You can explain the full CDN request lifecycle without notes, write correct Cache-Control headers for any content type, and calculate cache hit ratio from given numbers."
            ),
            session(2,
                "Cache Invalidation, Origin Shield, and Push vs Pull CDNs",
                "Cache invalidation and origin shield design are the most common CDN system design interview topics and the most frequently misconfigured in production.",
                "intermediate", 50,
                "Your marketing team pushed the wrong hero image to 50 million users. It is cached with a 1-year TTL. How do you fix it in the next 5 minutes?",
                "Cache invalidation is famously one of the two hard problems in computer science. Getting it wrong means users see stale or incorrect content — sometimes for days.",
                ["Compare TTL expiry, versioned URLs, and API invalidation strategies",
                 "Explain surrogate keys (cache tags) and when to use them",
                 "Design origin shield topology for a global system",
                 "Choose between push and pull CDN for a given use case"],
                CDN_S2_CONTENT,
                ["Versioned URLs + immutable TTL is the correct strategy for static assets — eliminates invalidation entirely",
                 "API invalidation is for emergencies; surrogate keys are for structured content relationships",
                 "Origin shield collapses all PoP misses into a single origin request — essential for high-traffic sites",
                 "Pull CDN is the default; push CDN only makes sense for large files with predictable massive demand",
                 "stale-while-revalidate prevents cache stampede without thundering herd"],
                [{"description": "Sketch origin shield topology for a global e-commerce site with origin in us-east-1", "durationMinutes": 10},
                 {"description": "Design a cache invalidation strategy for a CMS where publishing an article updates homepage, category, and tag pages", "durationMinutes": 15},
                 {"description": "Write Cache-Control headers for: a product image, a homepage HTML, a stock-level API endpoint", "durationMinutes": 10},
                 {"description": "Answer review questions", "durationMinutes": 15}],
                [{"title": "Cloudflare Cache Tag purging", "type": "docs", "url": "https://developers.cloudflare.com/cache/how-to/purge-cache/"},
                 {"title": "CloudFront Origin Shield", "type": "docs", "url": "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html"}],
                CDN_S2_REVIEW,
                "You can design a complete CDN strategy for a production system — choosing invalidation approach, origin shield placement, and explaining every trade-off in a system design interview."
            ),
        ]
    },
    "quizBank": [
        q("Which Cache-Control directive sets TTL specifically for CDN/proxy caches, overriding max-age for shared caches?",
          "multiple-choice", 2, "Remember",
          ["max-age", "s-maxage", "no-cache", "proxy-revalidate"],
          "s-maxage",
          "s-maxage sets TTL for shared caches (CDNs, proxies) independently. CDNs use s-maxage when present, falling back to max-age. Browsers always use max-age."),
        q("What is the primary benefit of an origin shield in a CDN architecture?",
          "multiple-choice", 3, "Understand",
          ["Encrypts traffic between CDN and origin",
           "Collapses cache miss requests from multiple PoPs into a single origin request",
           "Provides DDoS protection at layer 3",
           "Compresses responses before sending to edge nodes"],
          "Collapses cache miss requests from multiple PoPs into a single origin request",
          "Origin shield is a mid-tier cache. When multiple PoPs miss for the same object, all route to the shield which makes exactly one origin request, dramatically reducing origin load."),
        q("A file is cached with max-age=31536000. Content was just updated. Without URL versioning, what is the fastest way to serve the new content?",
          "multiple-choice", 3, "Apply",
          ["Wait for TTL to expire",
           "Use the CDN API to create an invalidation",
           "Change the HTTP method to POST",
           "Set Pragma: no-cache"],
          "Use the CDN API to create an invalidation",
          "API invalidation immediately purges the cached object. The next request fetches the new version from origin. This is why versioned URLs are preferred — they eliminate the need for invalidation entirely."),
        q("A CDN PoP serves 1,000,000 req/day. 950,000 are cache hits, 50,000 hit origin. What is the CHR?",
          "multiple-choice", 2, "Apply",
          ["95% — acceptable for static assets",
           "95% — not acceptable, should be >99%",
           "5% — not acceptable",
           "50% — borderline"],
          "95% — acceptable for static assets",
          "CHR = 950,000 / 1,000,000 = 95%. For static assets 90%+ is generally acceptable. The 5% represents cache fills from origin, which is normal."),
        q("What is a cache stampede and which stale-serving directive mitigates it?",
          "free-response", 4, "Understand", [],
          "Cache stampede: when a popular cached object's TTL expires across multiple PoPs simultaneously, causing hundreds of concurrent origin requests for the same content. Mitigation: stale-while-revalidate allows serving stale content while one background request refreshes the cache.",
          "stale-while-revalidate=N means 'serve stale for up to N seconds while refreshing in background', serialising the revalidation request and preventing thundering herd."),
        q("Explain surrogate keys and give a concrete e-commerce use case.",
          "free-response", 3, "Apply", [],
          "Surrogate keys tag cached responses with logical identifiers via response headers. A single purge API call invalidates all cached objects sharing a tag. E-commerce: tag every page referencing product #42 with 'product-42'. When inventory changes, purge that tag to instantly refresh the product page, category listing, and search results.",
          "Fastly calls these Surrogate-Key headers; Cloudflare uses Cache-Tag. CloudFront requires custom implementation."),
        q("When would you choose a push CDN over a pull CDN?",
          "free-response", 3, "Apply", [],
          "Push CDN when: you have large files (50+ GB) like game patches or OS updates; you know content will be accessed by a massive simultaneous audience on a specific date; zero cold-start latency for the first user is required.",
          "Pull CDN is correct for almost all web content. Push CDN is a specialised tool for predictable massive demand on large binary files."),
        q("How does Anycast routing direct users to the nearest CDN PoP?",
          "free-response", 4, "Understand", [],
          "CDNs advertise the same IP address from every PoP via BGP Anycast. Internet routing automatically directs packets to the topologically nearest announcement of that IP. The user never selects a PoP — BGP routing does it transparently based on network topology, not geographic distance.",
          "Anycast differs from GeoDNS, which returns different IPs based on requester location. Anycast works at the IP routing level."),
    ]
}

# ═══════════════════════════════════════════════════════════════════════════════
# TOPIC 2 — Rate Limiting & Throttling
# ═══════════════════════════════════════════════════════════════════════════════

RL_S1_CONTENT = """\
## Why Rate Limiting Exists

Without rate limiting, a single misbehaving client — whether malicious or simply buggy — can consume your entire server capacity. A developer with a misconfigured retry loop, an attacker running a credential-stuffing script, or a legitimate client experiencing a bug can all trigger the same failure mode: resource exhaustion that degrades service for every other user.

Rate limiting serves four distinct purposes simultaneously:

- **Availability protection**: prevents any single client from consuming all CPU, memory, DB connections, or downstream API quota
- **Fairness**: in multi-tenant systems, ensures no single tenant starves others (important for SLA guarantees)
- **Cost control**: cloud APIs charge per request; unbounded clients create unbounded cloud bills
- **Security**: slows brute-force login attacks, credential stuffing, and API enumeration — a 10 req/min limit on `/login` makes a brute-force attack take centuries

Every major public API — GitHub, Stripe, Twitter/X, Twilio — implements rate limiting. Understanding the algorithms that power them is essential for building reliable systems.

---

## Token Bucket Algorithm

The token bucket is the most widely deployed rate limiting algorithm because it naturally handles the way real clients behave: they burst occasionally but have a predictable average rate.

**Conceptual model:** Imagine a bucket with a capacity of N tokens. Tokens are added at a constant rate R (e.g., 10 tokens per second). Each API request consumes one token. If the bucket has at least one token, the request is allowed and a token is consumed. If the bucket is empty, the request is rejected with HTTP 429.

The key insight: a client that hasn't made requests for a while accumulates tokens (up to capacity), allowing a burst. A client sending requests continuously is limited to exactly rate R.

```python
import time

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.tokens = float(capacity)   # start full — first burst allowed immediately
        self.refill_rate = refill_rate  # tokens per second
        self.last_refill = time.monotonic()

    def allow(self) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_refill
        # Credit tokens earned since last check (lazy refill — no background thread needed)
        self.tokens = min(
            self.capacity,
            self.tokens + elapsed * self.refill_rate
        )
        self.last_refill = now

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False
```

**Why lazy refill?** Rather than running a background thread to add tokens on a schedule, we calculate how many tokens would have been added since the last call and add them in the current request. This is O(1), thread-safe (with proper locking), and requires no background process.

**Properties:** Allows bursting up to capacity; average rate is R req/sec; memory O(1) per user (just `tokens` and `last_refill`). Used by AWS API Gateway, Stripe, GitHub, and most production API rate limiters.

---

## Leaky Bucket Algorithm

The leaky bucket takes a different approach: instead of tracking tokens, requests enter a queue (the "bucket") and are processed at a fixed constant rate. Requests that arrive when the queue is full are dropped immediately.

```mermaid
graph LR
    R1[Incoming Request] --> B[Queue Bucket<br/>max size C]
    R2[Incoming Request] --> B
    R3[Overflow Request] -.->|429 rejected| X[Dropped]
    B -->|constant rate: 1 req per 100ms| S[Server / Processor]
```

The output is perfectly smooth: regardless of how many requests arrive in a burst, the server sees exactly R requests per second. This is ideal for protecting downstream systems with fixed processing capacity — a database that can handle exactly 100 writes/second benefits from a leaky bucket that smooths a 1000 req/burst spike into a steady 100 req/sec stream.

**Token vs Leaky comparison:**

| Dimension | Token Bucket | Leaky Bucket |
|---|---|---|
| Burst allowed? | Yes (up to bucket capacity) | No (excess immediately dropped) |
| Output rate | Average R/s, instantaneous variable | Exactly constant R/s |
| Best for | API rate limiting (client-friendly) | Network traffic shaping, protecting fixed-capacity downstream |
| Implementation | Counter + timestamp | Queue |

---

## Fixed Window Counter

The simplest implementation: divide time into equal-sized windows (e.g., each minute is a window). Count requests per user per window. If count exceeds the limit, reject.

```python
def allow_fixed_window(user_id: str, limit: int, window_seconds: int) -> bool:
    # Key encodes the window — automatically changes every window_seconds
    window_id = int(time.time()) // window_seconds
    key = f"rl:{user_id}:{window_id}"
    count = redis.incr(key)
    if count == 1:
        redis.expire(key, window_seconds)  # auto-cleanup after window ends
    return count <= limit
```

Simple, O(1) memory per user, one Redis operation per request. But it has a critical flaw.

**The Boundary Attack:** A user is allowed 100 requests per minute. They send 100 requests at 12:00:59 (the last second of window 1) and 100 more at 12:01:01 (the first second of window 2). Both windows see only 100 requests — both allow them. The user sent 200 requests in 2 seconds. This is twice the intended rate limit:

```
Window 1: [=======12:00:00=========>12:00:59] 100 req (full)
Window 2: [12:01:00<=12:01:01================] 100 req (only 2 sec in)
                    ^-- 200 requests in 2 seconds gap
```

For many non-security applications this is acceptable. For security-sensitive endpoints (login, password reset), it is not.

---

## Sliding Window Log

The sliding window log solves the boundary attack by maintaining a precise record of all request timestamps within a rolling window.

```python
def allow_sliding_log(user_id: str, limit: int, window_seconds: int) -> bool:
    now = time.time()
    key = f"rl:log:{user_id}"
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - window_seconds)  # evict timestamps outside window
    pipe.zcard(key)                                       # count requests in window
    pipe.zadd(key, {str(now): now})                       # record this request
    pipe.expire(key, window_seconds)                      # auto-cleanup
    results = pipe.execute()
    count_before = results[1]  # count BEFORE adding current request
    return count_before < limit
```

At every request, we look at exactly the last `window_seconds` of timestamps — no boundary ambiguity. If there are fewer than `limit` timestamps in that window, the request is allowed.

**The memory cost:** Every allowed request stores one timestamp. For a user allowed 1000 req/min, that's 1000 entries × (timestamp size + overhead) ≈ ~100 KB per user in the worst case. At millions of users, this is prohibitive. Sliding window log is only practical for low-traffic systems or very small limits.

---

## Sliding Window Counter: The Production Compromise

The sliding window counter uses only two integers per user — the previous window count and the current window count — to approximate the sliding window calculation with negligible error.

```
estimated_count = prev_count × (1 - elapsed_in_current_window / window_size) + curr_count
```

**Worked example:** Window = 60 seconds, limit = 100 requests. It is currently second 45 of the current window (so 15 seconds remain in the previous window's overlap).

- Previous window had 80 requests
- Current window so far has 30 requests
- Previous window's weighted contribution: 80 × (15/60) = 80 × 0.25 = 20
- Estimated total: 20 + 30 = **50 requests** → well under limit, allow

The mathematical intuition: as you move through the current window, the previous window's contribution linearly decays from 100% at the boundary to 0% at the end of the current window. This is an excellent approximation of a true sliding window.

**Error rate:** Google research found this approximation has less than 0.003% error at realistic traffic patterns. Combined with O(1) memory, this is the recommended production algorithm for most systems."""

RL_S1_REVIEW = [
    "What are the four main rate limiting algorithms and their primary trade-offs?:::Token bucket (allows bursting, O(1) memory), leaky bucket (constant output rate, no bursting), fixed window counter (simple, O(1), vulnerable to boundary attack), sliding window log (precise, O(n) memory), sliding window counter (O(1), approximate but accurate).",
    "Explain the boundary attack vulnerability in fixed window rate limiting.:::A user sends N requests just before a window boundary and N more just after. Both windows count only N, but the user sent 2N requests in a very short span — effectively double the intended limit. Sliding window algorithms prevent this.",
    "Token bucket vs leaky bucket: which allows bursting and which guarantees constant output rate?:::Token bucket allows bursting up to bucket capacity (N simultaneous requests if tokens are available). Leaky bucket guarantees constant output rate R/sec regardless of input burst — excess requests are dropped or queued.",
    "Why is sliding window log expensive at high traffic, and what is the alternative?:::Sliding window log stores every request timestamp, so memory is O(requests in window) per user. At 1000 req/min per user with millions of users, this is prohibitive. Sliding window counter uses only two integers per user (O(1)) and approximates the sliding window with <0.1% error.",
]

RL_S2_CONTENT = """\
## Distributed Rate Limiting: The Hard Problem

A single-server rate limiter is trivial. The challenge is maintaining consistent limits across a **fleet of stateless API servers**.

```mermaid
graph TD
    U[User] --> LB[Load Balancer]
    LB --> S1[API Server 1<br/>local counter: 30]
    LB --> S2[API Server 2<br/>local counter: 25]
    LB --> S3[API Server 3<br/>local counter: 28]
    S1 --> R[(Redis Cluster<br/>global counter: 83)]
    S2 --> R
    S3 --> R
```

Without a shared store, each server maintains its own counter. A user hitting all three servers can send 3× the limit. The solution: centralise state in Redis.

---

## Redis-Based Rate Limiter

```python
import redis
import time

r = redis.Redis()

def allow_request(user_id: str, limit: int, window: int) -> tuple[bool, dict]:
    # Sliding window counter using Redis sorted set
    now = time.time()
    key = f"rl:{user_id}"

    pipe = r.pipeline()
    # Remove timestamps outside the window
    pipe.zremrangebyscore(key, 0, now - window)
    # Count remaining requests
    pipe.zcard(key)
    # Add current request timestamp
    pipe.zadd(key, {f"{now}": now})
    pipe.expire(key, window)
    _, count, _, _ = pipe.execute()

    allowed = count < limit
    headers = {
        "X-RateLimit-Limit": limit,
        "X-RateLimit-Remaining": max(0, limit - count - 1),
        "X-RateLimit-Reset": int(now) + window,
        "Retry-After": window if not allowed else None,
    }
    return allowed, headers
```

**Atomic Lua script for token bucket in Redis (production pattern):**
```lua
-- KEYS[1] = rate limit key
-- ARGV[1] = capacity, ARGV[2] = refill_rate, ARGV[3] = now (unix ms)
local tokens = tonumber(redis.call('GET', KEYS[1]))
local last = tonumber(redis.call('GET', KEYS[1]..':ts')) or tonumber(ARGV[3])
local now = tonumber(ARGV[3])
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])

tokens = tokens or capacity
local elapsed = (now - last) / 1000.0
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens >= 1 then
    tokens = tokens - 1
    redis.call('SET', KEYS[1], tokens)
    redis.call('SET', KEYS[1]..':ts', now)
    return 1  -- allowed
else
    return 0  -- rejected
end
```

Lua scripts execute atomically in Redis — no race conditions, no distributed locks needed.

---

## Rate Limiting Layers and Granularity

Rate limits should be applied at multiple layers:

| Layer | Scope | Tool |
|---|---|---|
| Network | IP address | CDN (Cloudflare, AWS WAF), nginx |
| Application gateway | API key / user ID | Kong, API Gateway, custom middleware |
| Service | Per-endpoint per-user | Application code + Redis |
| Database | Query rate | Connection pool limits |

**Granularity options:**
- Per IP (anti-DDoS, but breaks NAT/proxies)
- Per API key (accurate, but API key must be validated first)
- Per user ID (best for authenticated endpoints)
- Per endpoint + user (most precise: different limits for /search vs /checkout)

---

## Handling Limit Responses: HTTP 429

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1711060800
Retry-After: 60
Content-Type: application/json

{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please retry after 60 seconds.",
  "retry_after": 60
}
```

**Client-side best practices:**
- Respect `Retry-After` header — exponential backoff with jitter
- Cache responses where possible to reduce API calls
- Use webhooks/streaming instead of polling for real-time data

---

## Thundering Herd on Limit Reset

When a rate limit window resets, all throttled clients retry simultaneously. Solutions:

1. **Jitter in Retry-After**: add random offset to reset timestamp
2. **Token bucket instead of fixed window**: gradual token replenishment avoids synchronised resets
3. **Queue with backpressure**: accept requests into a queue rather than immediately rejecting
4. **Staggered windows per user**: hash user ID to offset their window start time

---

## Interview: Designing a Rate Limiter System

**System design question: "Design a rate limiter for a public API"**

Key decisions to discuss:
1. **Algorithm**: Token bucket (recommended for API rate limiting — handles bursting naturally)
2. **Storage**: Redis with atomic Lua scripts for consistency; local in-memory cache for performance with async sync to Redis
3. **Granularity**: Per user ID per endpoint, different limits per tier (free/pro/enterprise)
4. **Placement**: API gateway layer before application servers
5. **Failure mode**: If Redis is down, fail open (allow all) or fail closed (reject all)? — depends on security requirements
6. **Response**: Always return RateLimit headers; return 429 with Retry-After on rejection"""

RL_S2_REVIEW = [
    "Why does a local in-memory rate limiter fail in a horizontally scaled API fleet?:::Each server maintains its own independent counter. A user whose requests are distributed across N servers can send N times the limit — each server sees only its own fraction. A shared centralised store (Redis) is required for accurate global rate limiting.",
    "Why use a Lua script in Redis for rate limiting instead of a standard GET + SET?:::GET then SET is two separate commands with a race condition between them — another request could execute between them and cause counter inconsistency. Lua scripts execute atomically in Redis, so the read-modify-write is a single uninterruptible operation. No distributed locks needed.",
    "What HTTP status code and headers should a rate-limited response include?:::HTTP 429 Too Many Requests. Headers: X-RateLimit-Limit (the limit), X-RateLimit-Remaining (0 when limited), X-RateLimit-Reset (epoch when limit resets), Retry-After (seconds until client may retry).",
    "When designing a rate limiter, what failure mode should you choose if Redis goes down — fail open or fail closed?:::It depends on security requirements. Fail open (allow all requests) if the priority is availability — public APIs, non-security-critical endpoints. Fail closed (reject all) if the priority is security — authentication endpoints, financial transactions, or compliance-sensitive operations.",
]

rate_limiting = {
    "topic": "Rate Limiting & Throttling",
    "category": "System Design",
    "cheatSheet": """\
# Rate Limiting Cheat Sheet

## Algorithm Comparison
| Algorithm | Burst | Memory | Accuracy | Use Case |
|---|---|---|---|---|
| Token Bucket | Yes | O(1) | Exact | API rate limiting |
| Leaky Bucket | No | O(queue) | Exact | Network traffic shaping |
| Fixed Window | Yes | O(1) | Boundary attack risk | Simple counters |
| Sliding Window Log | No | O(n) | Exact | Low-traffic, precision needed |
| Sliding Window Counter | Small | O(1) | ~99.9% | Production API limiting |

## Token Bucket in Redis (Lua)
```lua
local tokens = redis.call('GET', KEYS[1]) or CAPACITY
local elapsed = (NOW - LAST_TS) / 1000.0
tokens = math.min(CAPACITY, tokens + elapsed * RATE)
if tokens >= 1 then tokens = tokens - 1; return 1
else return 0 end
```

## HTTP 429 Response
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1711060800
Retry-After: 60
```

## Granularity Layers
1. IP — CDN/WAF level (anti-DDoS)
2. API Key — gateway level
3. User ID — application level
4. User ID + Endpoint — most precise

## Key Design Decisions (Interview)
- Algorithm: Token bucket for APIs (burst-friendly)
- Storage: Redis + atomic Lua scripts
- Failure mode: fail open (availability) vs fail closed (security)
- Headers: always return RateLimit headers even on success
- Placement: API gateway before application servers""",
    "resources": [
        resource("An Introduction to Rate Limiting", "Stripe Engineering Blog", "blogs",
                 "Stripe explains how they built their own rate limiting system with token buckets",
                 "Engineers building rate limiters", "30 min", "Free", "HIGH",
                 "https://stripe.com/blog/rate-limiters"),
        resource("Redis Rate Limiting Patterns", "Redis", "docs",
                 "Official Redis documentation on implementing rate limiters with atomic Lua scripts",
                 "Engineers using Redis for rate limiting", "1 hour", "Free", "HIGH",
                 "https://redis.io/glossary/rate-limiting/"),
        resource("Designing Distributed Systems", "Burns, Beda, Hightower", "books",
                 "Covers distributed coordination patterns applicable to rate limiting",
                 "Engineers building distributed systems", "10 hours", "~$40", "MEDIUM"),
    ],
    "ladder": {"levels": [
        level(1, "Novice", "Novice",
              "Understands what rate limiting is and why it is needed",
              ["Explains 429 Too Many Requests", "Knows rate limiting protects against abuse and overload", "Reads Retry-After headers"],
              "Simple In-Memory Rate Limiter",
              "Implement a token bucket rate limiter in Python/Node with unit tests; handle 429 response correctly",
              3, ["Confusing rate limiting with authentication", "Not implementing Retry-After"], 4,
              ["Basic HTTP knowledge", "One programming language"]),
        level(2, "Advanced Beginner", "Advanced Beginner",
              "Implements rate limiting middleware and understands multiple algorithms",
              ["Implements fixed window and sliding window counters", "Uses Redis for distributed state", "Returns correct HTTP 429 headers"],
              "Redis-Backed API Rate Limiter",
              "Build Express/FastAPI middleware using Redis sliding window counter with proper 429 responses and RateLimit headers",
              8, ["Race conditions in non-atomic Redis operations", "Not accounting for clock skew"], 15,
              ["Redis basics", "Middleware/interceptor patterns"]),
        level(3, "Competent", "Competent",
              "Designs multi-tier rate limiting for production APIs",
              ["Designs per-tier rate limit schemas (free/pro/enterprise)", "Implements atomic Lua scripts in Redis", "Handles failure modes gracefully"],
              "Multi-Tier API Rate Limiting Service",
              "Build a rate limiting service with different limits per API key tier, atomic Redis Lua scripts, and graceful Redis failure handling",
              20, ["Single point of failure on Redis", "Not load testing the limiter itself"], 40,
              ["Redis advanced patterns", "API design experience"]),
        level(4, "Proficient", "Proficient",
              "Architects rate limiting for high-scale distributed systems",
              ["Designs local+global hybrid limiters for performance", "Implements distributed rate limiting across data centers", "Analyses trade-offs between consistency and availability"],
              "Global Rate Limiting at Scale",
              "Design a rate limiting system that works across 3 geographic regions with <5ms overhead per request using local token buckets synced to a global Redis cluster",
              40, ["Assuming Redis is always fast enough", "Not accounting for network partitions"], 80,
              ["Distributed systems experience", "Redis cluster operations"]),
        level(5, "Expert", "Expert",
              "Designs rate limiting architecture for platforms at internet scale",
              ["Designs cell-based rate limiting for multi-tenant platforms", "Evaluates GCRA and adaptive rate limiting algorithms", "Builds rate limiting as a separate service with SLA guarantees"],
              "Rate Limiting Service with Adaptive Algorithms",
              "Design and implement a rate limiting service using Generic Cell Rate Algorithm (GCRA) with adaptive limits based on system load, serving 100K+ API clients",
              80, ["Over-engineering for scale that does not exist yet", "Missing the human factors of limit communication to API consumers"], 150,
              ["Platform engineering experience", "Deep Redis/distributed cache expertise"]),
    ]},
    "plan": {
        "overview": "Master rate limiting from algorithm internals to distributed production systems, covering token bucket, leaky bucket, sliding window variants, Redis-based distributed limiting, and system design interview patterns.",
        "skippedTopics": "Network-layer traffic shaping (TC qdisc), GCRA algorithm internals, specific vendor API Gateway configuration details",
        "sessions": [
            session(1,
                "Rate Limiting Algorithms: Token Bucket, Leaky Bucket, and Sliding Windows",
                "Algorithm internals appear in every rate limiting interview question and determine which approach fits a given problem.",
                "intermediate", 50,
                "Your public API is being hammered by a client whose code has a bug — it sends 10,000 requests per second. How do you protect your service without blocking legitimate users?",
                "Rate limiting is the first line of defence for any public API. Understanding the algorithms is essential for both implementing them and discussing trade-offs in system design interviews.",
                ["Implement token bucket rate limiting from scratch",
                 "Explain leaky bucket and when to prefer it over token bucket",
                 "Identify the boundary attack vulnerability in fixed window rate limiting",
                 "Compare sliding window log vs sliding window counter for memory and accuracy"],
                RL_S1_CONTENT,
                ["Token bucket allows bursting up to capacity; leaky bucket enforces constant output rate",
                 "Fixed window counter is vulnerable to boundary attacks — users can send 2x limit across window boundaries",
                 "Sliding window log is precise but O(n) memory; sliding window counter approximates it in O(1)",
                 "Token bucket is the recommended algorithm for API rate limiting due to burst tolerance",
                 "Rate limiting memory cost: O(1) for token/fixed window, O(requests) for sliding log"],
                [{"description": "Implement token bucket in your language of choice without looking at examples", "durationMinutes": 20},
                 {"description": "Draw the boundary attack scenario with concrete numbers to understand the vulnerability", "durationMinutes": 10},
                 {"description": "Compare algorithms in a table: burst support, memory, accuracy, use case", "durationMinutes": 10},
                 {"description": "Answer review questions", "durationMinutes": 10}],
                [{"title": "Stripe Rate Limiter blog post", "type": "article", "url": "https://stripe.com/blog/rate-limiters"},
                 {"title": "Rate Limiting Algorithms — Wikipedia", "type": "article", "url": "https://en.wikipedia.org/wiki/Token_bucket"}],
                RL_S1_REVIEW,
                "You can implement token bucket from scratch, explain the boundary attack vulnerability, and choose the correct algorithm for a given use case."
            ),
            session(2,
                "Distributed Rate Limiting with Redis and System Design Patterns",
                "Distributed rate limiting is the real-world challenge — single-server solutions fail immediately in a scaled API fleet.",
                "advanced", 55,
                "You have 100 API servers behind a load balancer. Your rate limit is 100 req/min per user. How do you ensure the limit holds even when requests are spread across all 100 servers?",
                "Every production API fleet is horizontally scaled. Building a rate limiter that works correctly across dozens of servers is a common system design challenge and senior engineer competency.",
                ["Design a Redis-based distributed rate limiter",
                 "Explain why atomic Lua scripts are required for correctness",
                 "Apply rate limiting at multiple granularity levels (IP, API key, user, endpoint)",
                 "Handle Redis failure modes gracefully in production"],
                RL_S2_CONTENT,
                ["Without shared state, each API server enforces limits independently — users can send N×limit requests across N servers",
                 "Lua scripts in Redis execute atomically — no race conditions, no need for distributed locks",
                 "Rate limit at multiple layers: CDN (IP), API gateway (API key), application (user+endpoint)",
                 "Return X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After on every response",
                 "Failure mode choice (fail open vs closed) depends on whether availability or security takes priority"],
                [{"description": "Implement Redis-based sliding window counter rate limiter with correct atomic operations", "durationMinutes": 25},
                 {"description": "Design the rate limit schema for a SaaS API with free/pro/enterprise tiers", "durationMinutes": 15},
                 {"description": "Answer review questions", "durationMinutes": 15}],
                [{"title": "Redis Rate Limiting patterns", "type": "docs", "url": "https://redis.io/glossary/rate-limiting/"},
                 {"title": "AWS API Gateway throttling", "type": "docs", "url": "https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html"}],
                RL_S2_REVIEW,
                "You can design and implement a distributed rate limiter for a production API fleet, justify algorithm and storage choices, and articulate failure mode trade-offs."
            ),
        ]
    },
    "quizBank": [
        q("Which rate limiting algorithm allows burst traffic up to a capacity limit while enforcing an average rate?",
          "multiple-choice", 2, "Remember",
          ["Leaky Bucket", "Fixed Window Counter", "Token Bucket", "Sliding Window Log"],
          "Token Bucket",
          "Token bucket stores tokens up to capacity. A burst can consume all tokens instantly (up to capacity), then requests are limited to the refill rate. Leaky bucket has no burst — output is constant."),
        q("A fixed window rate limiter allows 100 req/min. A user sends 100 requests at 12:00:59 and 100 at 12:01:01. How many total requests did they successfully send?",
          "multiple-choice", 3, "Analyze",
          ["100 (first window filled)", "200 (both windows accepted them)", "150 (averaged across windows)", "50 (penalty applied)"],
          "200 (both windows accepted them)",
          "This is the boundary attack. Window 1 (12:00-12:01) saw 100 requests. Window 2 (12:01-12:02) saw 100 requests. Both windows allowed their requests. The user sent 200 requests in 2 seconds while the limit is 100/minute."),
        q("Why must Redis Lua scripts be used instead of separate GET + INCR commands for a rate limiter?",
          "multiple-choice", 3, "Understand",
          ["Lua scripts are faster than individual commands",
           "GET + INCR has a race condition between the two commands",
           "Redis does not support INCR natively",
           "Lua scripts persist across Redis restarts"],
          "GET + INCR has a race condition between the two commands",
          "Between GET (read count) and INCR (increment), another request can execute, leading to incorrect counts. Lua scripts are atomic in Redis — the entire script executes without interruption."),
        q("What HTTP status code indicates a rate limit has been exceeded, and which header tells the client when to retry?",
          "multiple-choice", 2, "Remember",
          ["503 Service Unavailable + Retry-After", "429 Too Many Requests + Retry-After", "429 Too Many Requests + X-RateLimit-Reset", "503 + X-Throttle-Retry"],
          "429 Too Many Requests + Retry-After",
          "HTTP 429 Too Many Requests is the correct status for rate limiting. Retry-After tells the client how many seconds to wait. X-RateLimit-Reset gives the epoch timestamp when the window resets (both are commonly returned together)."),
        q("Your rate limiter Redis node goes down. Should you fail open (allow all requests) or fail closed (reject all)? What determines the right answer?",
          "free-response", 4, "Evaluate", [],
          "It depends on security requirements. Fail open for: public content APIs, non-security-critical endpoints, when availability SLA > security concern. Fail closed for: authentication endpoints, financial transactions, security-critical operations where bypassing limits creates risk. Most production systems fail open to maintain availability, but with monitoring and alerting.",
          "There is no universally correct answer — it is a deliberate architectural trade-off between availability and security that must be made per-endpoint."),
        q("Explain the difference between token bucket and leaky bucket algorithms and name a use case for each.",
          "free-response", 3, "Understand", [],
          "Token bucket: requests consume tokens from a bucket that refills at rate R. Allows bursting up to bucket capacity. Use case: API rate limiting where clients need burst capacity for batch operations. Leaky bucket: requests enter a queue and are processed at constant rate R. No burst tolerance. Use case: network traffic shaping where downstream systems need constant input rate.",
          "Token bucket is preferred for API rate limiting. Leaky bucket is preferred for network QoS where constant output rate protects downstream capacity-constrained systems."),
        q("How does a sliding window counter achieve O(1) memory while avoiding the boundary attack of fixed window?",
          "free-response", 4, "Understand", [],
          "It uses two fixed-window counters (previous and current window) and estimates the request count as: prev_count × (1 - elapsed/window) + curr_count. This approximates a sliding window without storing individual timestamps. Memory is O(1) per user (just two counters). The approximation error is typically <0.003% at realistic traffic patterns.",
          "The key insight is that the previous window's contribution decays linearly as the window slides forward, which can be computed from just two counters."),
    ]
}

# ═══════════════════════════════════════════════════════════════════════════════
# TOPIC 3 — Authentication & Authorization
# ═══════════════════════════════════════════════════════════════════════════════

AUTH_S1_CONTENT = """\
## Authentication vs Authorization

These terms are frequently conflated in interviews:

- **Authentication (AuthN)**: Who are you? Verify identity. (Login, API key check)
- **Authorization (AuthZ)**: What can you do? Verify permissions. (RBAC, policy check)

Authentication always precedes authorization. You cannot authorize an unknown identity.

---

## OAuth 2.0: The Delegation Framework

OAuth 2.0 is not an authentication protocol — it is an **authorization delegation framework**. It lets users grant third-party apps limited access to their resources without sharing passwords.

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client App
    participant AS as Auth Server
    participant RS as Resource Server (API)

    U->>C: Click "Login with Google"
    C->>AS: Authorization Request<br/>(client_id, scope, redirect_uri, state)
    AS->>U: Login + Consent Screen
    U->>AS: Approve
    AS->>C: Authorization Code (via redirect)
    C->>AS: Exchange code for tokens<br/>(code + client_secret)
    AS->>C: Access Token + Refresh Token
    C->>RS: API Request + Bearer Token
    RS->>RS: Validate token
    RS->>C: Protected Resource
```

**Four OAuth 2.0 Grant Types:**

| Grant Type | Use Case |
|---|---|
| Authorization Code | Web apps with backend (most secure, use PKCE for SPAs) |
| Client Credentials | Machine-to-machine (no user involved) |
| Device Code | TV/CLI apps without browser |
| ~~Implicit~~ | Deprecated — replaced by Auth Code + PKCE |

**PKCE (Proof Key for Code Exchange):** Required for public clients (SPAs, mobile). Client generates a `code_verifier` (random), hashes it to `code_challenge`, sends challenge with auth request, and verifier with token exchange. Prevents authorization code interception.

---

## JWT: JSON Web Tokens

A JWT is a self-contained, signed token. The resource server validates it **without calling the auth server**.

```
Header.Payload.Signature
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTcxMTA2MDgwMH0.SIG
```

```python
import jwt  # PyJWT

# Create (auth server side)
token = jwt.encode(
    {"sub": "user_123", "role": "admin", "exp": time.time() + 3600},
    private_key,
    algorithm="RS256"
)

# Verify (resource server side — no auth server call needed)
payload = jwt.decode(token, public_key, algorithms=["RS256"])
user_id = payload["sub"]
role = payload["role"]
```

**JWT Security Rules:**
1. **Never store secrets in payload** — it is base64-encoded, not encrypted
2. **Always validate `exp`** — expired tokens must be rejected
3. **Prefer RS256 over HS256** — asymmetric signature allows public key distribution without sharing secrets
4. **Keep JWTs short-lived** — 15 minutes for access tokens; use refresh tokens for longer sessions
5. **Implement token revocation** via a denylist or short TTL + refresh token rotation

**JWT vs Opaque Tokens:**

| | JWT | Opaque Token |
|---|---|---|
| Validation | Local (no network call) | Auth server lookup (network call) |
| Revocation | Difficult (must wait for exp) | Immediate (delete from store) |
| Size | ~500 bytes | ~32 bytes |
| Use case | Stateless microservices | When immediate revocation is required |

---

## SSO: Single Sign-On

SSO lets users authenticate once and access multiple applications. Two main protocols:

**SAML 2.0** — Enterprise/legacy. XML-based assertions. Identity Provider (IdP) issues signed XML tokens to Service Providers (SP). Okta, Azure AD, Google Workspace.

**OpenID Connect (OIDC)** — Modern. Built on OAuth 2.0. Adds `id_token` (JWT) for identity. Separates authentication (OIDC) from authorization (OAuth 2.0).

```
OIDC Token Types:
- id_token: Who the user is (JWT with name, email, sub)
- access_token: What the user can do (pass to APIs)
- refresh_token: Get new access tokens without re-login
```

**SSO Session Flow:**
1. User hits App A — no session
2. App A redirects to IdP
3. User authenticates at IdP — IdP creates SSO session cookie
4. IdP redirects back with token
5. User hits App B — no session
6. App B redirects to IdP — IdP sees SSO cookie, auto-issues token
7. User is logged into App B without re-entering credentials"""

AUTH_S1_REVIEW = [
    "What is the difference between authentication and authorization?:::Authentication (AuthN) verifies identity — who are you? Authorization (AuthZ) verifies permissions — what can you do? Authentication always precedes authorization.",
    "What is OAuth 2.0 and why is it NOT an authentication protocol?:::OAuth 2.0 is an authorization delegation framework — it lets users grant third-party apps limited access to their resources. It does not define how identity is verified (that is OpenID Connect built on top of it). The access token tells you what the holder can do, not who they are.",
    "Why is the Authorization Code grant type preferred over the implicit grant for SPAs?:::Authorization Code + PKCE is more secure because the access token is never exposed in the browser URL (redirect fragment). The implicit flow put tokens in the URL where they could be captured in browser history, referrer headers, or by malicious scripts. PKCE prevents authorization code interception by binding the code to a verifier only the legitimate client knows.",
    "What are the security implications of using HS256 vs RS256 for JWT signing?:::HS256 uses a shared symmetric secret — every service that verifies tokens must know the secret, creating many attack surfaces. RS256 uses asymmetric keys: the auth server signs with a private key, and any service can verify using the public key (distributable safely). Compromise of one verifier does not expose the signing key.",
]

AUTH_S2_CONTENT = """\
## RBAC: Role-Based Access Control

Users are assigned **roles**, and roles have **permissions**. Authorization checks role membership.

```python
# Role definitions
ROLES = {
    "viewer":    {"read:posts", "read:comments"},
    "editor":    {"read:posts", "write:posts", "read:comments", "write:comments"},
    "admin":     {"*"},  # all permissions
}

# User → Role mapping (from DB or JWT claim)
def has_permission(user_role: str, required_permission: str) -> bool:
    permissions = ROLES.get(user_role, set())
    return "*" in permissions or required_permission in permissions

# In a FastAPI route:
@app.delete("/posts/{id}")
async def delete_post(id: int, user=Depends(get_current_user)):
    if not has_permission(user.role, "write:posts"):
        raise HTTPException(403, "Insufficient permissions")
    ...
```

**RBAC vs ABAC (Attribute-Based Access Control):**
- RBAC: simple, fast, but coarse-grained ("admin can do everything")
- ABAC: fine-grained policies based on attributes (user, resource, environment): "editor can edit posts where post.author == user.id AND current_time is business_hours"
- Tools: OPA (Open Policy Agent) for ABAC/policy-as-code

---

## mTLS: Mutual TLS for Service-to-Service Auth

In standard TLS, only the server presents a certificate. In **mTLS**, both client and server present certificates, giving cryptographic mutual authentication.

```mermaid
sequenceDiagram
    participant C as Service A (Client)
    participant S as Service B (Server)

    C->>S: ClientHello
    S->>C: ServerHello + Server Certificate
    C->>S: Client Certificate
    S->>C: Verify Client Cert (CA check)
    C->>S: Verify Server Cert (CA check)
    Note over C,S: Mutual authentication complete
    C->>S: Encrypted API Request
    S->>C: Encrypted Response
```

**mTLS use cases:**
- Service mesh (Istio, Linkerd) — automatic mTLS between all pods
- Zero-trust network architecture
- Financial APIs (banking, payments) requiring client identity proof

**Certificate management:**
```bash
# Generate client cert with your internal CA
openssl req -new -newkey rsa:2048 -keyout client.key -out client.csr -subj "/CN=service-a"
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -out client.crt -days 365

# Use in curl
curl --cert client.crt --key client.key https://service-b:8443/api/resource
```

---

## Zero-Trust Architecture

Traditional security: "trust everything inside the network perimeter."
Zero-trust: **"never trust, always verify"** — treat every request as potentially hostile regardless of network location.

**Zero-trust pillars:**
1. **Verify explicitly**: Always authenticate and authorize based on all available signals (identity, device health, location, time)
2. **Least privilege access**: Grant minimum permissions required; time-limited where possible
3. **Assume breach**: Design assuming the network is already compromised; encrypt everything, segment access

**Implementation patterns:**
- mTLS for all service-to-service communication
- Short-lived tokens (no long-lived API keys)
- Continuous authorization (re-verify on every request, not just login)
- Device posture checks (is the device patched? enrolled in MDM?)

---

## JWT Token Security in Practice

```python
# Secure JWT configuration
from datetime import datetime, timedelta, timezone
import jwt

def create_access_token(user_id: str, roles: list[str]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "roles": roles,
        "iat": now,
        "exp": now + timedelta(minutes=15),  # SHORT-lived
        "jti": secrets.token_hex(16),        # unique token ID for revocation
    }
    return jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"])
        # Check token revocation denylist
        if redis.sismember("revoked_tokens", payload["jti"]):
            raise ValueError("Token has been revoked")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
```

**Refresh Token Rotation:**
1. Access token: 15 minutes, stateless JWT
2. Refresh token: 7 days, opaque, stored in DB
3. On refresh: issue new access token AND new refresh token; invalidate old refresh token
4. If old refresh token is reused → token theft detected → revoke all user sessions

---

## Common Auth Vulnerabilities (Interview Points)

| Vulnerability | Description | Mitigation |
|---|---|---|
| JWT alg:none | Attacker removes signature, sets alg=none | Reject tokens with alg=none; whitelist algorithms |
| JWT HS256 secret brute-force | Weak shared secret guessed offline | Use RS256; enforce strong secrets; rotate regularly |
| CSRF | Attacker tricks browser to make authenticated request | SameSite=Strict cookies; CSRF tokens; Origin header check |
| OAuth redirect_uri hijack | Attacker registers malicious redirect URI | Exact URI matching (no wildcards); validate state parameter |
| Token leakage in logs | Access tokens in URL query strings appear in logs | Always use Authorization header, never query params |"""

AUTH_S2_REVIEW = [
    "What is RBAC and when would you use ABAC instead?:::RBAC assigns permissions to roles and users to roles. Simple and fast. Use ABAC when RBAC becomes too coarse-grained — when access decisions require evaluating resource attributes, user attributes, and environmental context together (e.g., 'an editor can edit their own posts during business hours from an approved device').",
    "What is mTLS and how does it differ from standard TLS?:::Standard TLS: server presents certificate; client verifies server identity. mTLS: both server and client present certificates; each verifies the other's identity. This provides cryptographic mutual authentication, proving both parties are who they claim to be. Used in service meshes (Istio) and zero-trust architectures.",
    "Explain the 'alg:none' JWT vulnerability.:::Some JWT libraries allow an attacker to craft a token with the header algorithm set to 'none' and no signature. A vulnerable library skips signature verification for alg=none and accepts the forged token. Mitigation: always whitelist allowed algorithms (e.g., ['RS256']) and reject anything else, including 'none'.",
    "What is refresh token rotation and why does it help detect token theft?:::On each refresh: issue a new access token AND a new refresh token, invalidate the old refresh token. If an attacker steals a refresh token and uses it after the legitimate user already refreshed, the stolen token is already invalidated — triggering a 'refresh token reuse' alert. The system then revokes all user sessions, limiting attacker access window.",
]

auth = {
    "topic": "Authentication & Authorization",
    "category": "System Design",
    "cheatSheet": """\
# Auth Cheat Sheet

## OAuth 2.0 Grant Types
| Grant | Use Case |
|---|---|
| Authorization Code + PKCE | Web/SPA/Mobile apps |
| Client Credentials | Machine-to-machine |
| Device Code | TV/CLI without browser |

## JWT Security Checklist
- [ ] RS256 not HS256 (asymmetric keys)
- [ ] exp validated on every request
- [ ] Short TTL: 15 min access, 7 days refresh
- [ ] jti claim for revocation support
- [ ] Never secrets in payload (base64-encoded, not encrypted)
- [ ] Whitelist algorithms (reject alg:none)

## OIDC Token Types
- id_token: identity (JWT with sub, email, name)
- access_token: API access
- refresh_token: get new access tokens

## RBAC Quick Pattern
```python
ROLES = {"viewer": {"read"}, "editor": {"read","write"}, "admin": {"*"}}
def can(role, perm): return "*" in ROLES[role] or perm in ROLES[role]
```

## mTLS vs Standard TLS
- TLS: client verifies server cert
- mTLS: both verify each other's cert
- Use in: service mesh (Istio), zero-trust, financial APIs

## Zero-Trust Principles
1. Never trust, always verify
2. Least privilege access
3. Assume breach — encrypt everything, segment access

## Common Vulnerabilities
- alg:none → whitelist algorithms
- Weak HS256 secret → use RS256
- CSRF → SameSite=Strict + CSRF token
- redirect_uri hijack → exact match, validate state""",
    "resources": [
        resource("OAuth 2.0 RFC 6749", "IETF", "docs",
                 "The canonical specification for OAuth 2.0",
                 "Engineers implementing OAuth 2.0 flows", "3 hours", "Free", "HIGH",
                 "https://www.rfc-editor.org/rfc/rfc6749"),
        resource("jwt.io", "Auth0", "interactive",
                 "Interactive JWT decoder and verifier with library listings for every language",
                 "Understanding JWT structure and debugging tokens", "30 min", "Free", "HIGH",
                 "https://jwt.io"),
        resource("The Web Application Hacker's Handbook", "Stuttard & Pinto", "books",
                 "Comprehensive coverage of web auth vulnerabilities including OAuth, JWT, CSRF",
                 "Security-focused engineers", "15 hours", "~$45", "HIGH"),
    ],
    "ladder": {"levels": [
        level(1, "Novice", "Novice",
              "Understands the difference between authentication and authorization",
              ["Explains authn vs authz", "Reads JWTs using jwt.io", "Knows what OAuth 2.0 is for"],
              "Secure Login with JWT",
              "Build a simple login API that issues a JWT and a protected endpoint that validates it",
              4, ["Storing passwords in plain text", "Confusing OAuth tokens with session cookies"], 5,
              ["Basic HTTP knowledge", "One backend language"]),
        level(2, "Advanced Beginner", "Advanced Beginner",
              "Implements OAuth 2.0 Authorization Code flow and validates JWTs correctly",
              ["Implements OAuth 2.0 login with a real provider", "Validates JWT exp, iss, aud claims", "Implements basic RBAC middleware"],
              "OAuth 2.0 Login + RBAC",
              "Implement Google/GitHub OAuth 2.0 login with PKCE, JWT validation, and role-based route protection",
              10, ["Not validating redirect_uri exactly", "Storing refresh tokens insecurely"], 20,
              ["HTTP session management", "Basic security awareness"]),
        level(3, "Competent", "Competent",
              "Designs auth systems for multi-service architectures",
              ["Designs token refresh flow with rotation", "Implements mTLS for service-to-service auth", "Chooses between JWT and opaque tokens based on requirements"],
              "Multi-Service Auth Architecture",
              "Design auth for a 3-service system: user service issues JWTs, two downstream services validate them; implement refresh token rotation",
              25, ["JWT revocation is harder than expected", "mTLS certificate management complexity"], 50,
              ["OAuth 2.0 implementation experience", "Basic PKI knowledge"]),
        level(4, "Proficient", "Proficient",
              "Architects auth for large-scale distributed systems with zero-trust principles",
              ["Designs zero-trust network access patterns", "Implements fine-grained ABAC with OPA", "Designs SSO across multiple applications"],
              "Zero-Trust Auth Platform",
              "Design and implement OIDC-based SSO across 5 internal applications with OPA policy enforcement and mTLS service mesh",
              50, ["Over-complicating simple auth requirements", "Certificate rotation operations"], 100,
              ["Production auth system experience", "Service mesh knowledge"]),
        level(5, "Expert", "Expert",
              "Designs identity and access management platforms for enterprise and internet scale",
              ["Designs federated identity across organisations", "Architects CIAM (Customer Identity and Access Management) at scale", "Evaluates auth vendor trade-offs for enterprise compliance"],
              "Enterprise Identity Federation",
              "Design a federated identity system connecting 3 organisations' IdPs with cross-org RBAC and audit logging meeting SOC2/ISO27001 requirements",
              100, ["Compliance requirements conflicting with UX", "Cross-org trust establishment complexity"], 200,
              ["Enterprise auth platform experience", "Security compliance knowledge"]),
    ]},
    "plan": {
        "overview": "Master authentication and authorization from OAuth 2.0 flows to production security patterns, covering JWT, SSO, RBAC, mTLS, and zero-trust architecture.",
        "skippedTopics": "SAML 2.0 XML details, Kerberos, hardware security keys (FIDO2/WebAuthn internals), specific vendor IAM products",
        "sessions": [
            session(1,
                "OAuth 2.0, JWT, and SSO: Identity Protocols Demystified",
                "OAuth 2.0 and JWT appear in virtually every backend system design discussion and are common interview deep-dives.",
                "intermediate", 55,
                "How does clicking 'Sign in with Google' on a third-party app grant that app access to your Google Calendar without giving it your Google password?",
                "Every modern application uses OAuth 2.0 and JWTs. Misunderstanding these protocols leads to security vulnerabilities that are routinely exploited in production systems.",
                ["Explain OAuth 2.0 Authorization Code flow with PKCE",
                 "Decode and validate a JWT, explaining each claim",
                 "Distinguish between OAuth 2.0 (authorization) and OIDC (authentication)",
                 "Explain SSO session mechanics across multiple applications"],
                AUTH_S1_CONTENT,
                ["OAuth 2.0 is authorization delegation, not authentication — OIDC adds authentication on top",
                 "Authorization Code + PKCE is the correct grant type for SPAs and mobile apps",
                 "JWT payloads are base64-encoded not encrypted — never store secrets in claims",
                 "RS256 (asymmetric) is preferred over HS256 (symmetric) for JWTs in distributed systems",
                 "Short-lived access tokens (15 min) with refresh token rotation minimise theft impact"],
                [{"description": "Decode a real JWT at jwt.io and identify sub, exp, iat, and aud claims", "durationMinutes": 10},
                 {"description": "Draw the OAuth 2.0 Authorization Code + PKCE flow from memory", "durationMinutes": 15},
                 {"description": "Explain SSO flow to someone unfamiliar — use Google login across YouTube and Gmail as example", "durationMinutes": 10},
                 {"description": "Answer review questions", "durationMinutes": 20}],
                [{"title": "jwt.io interactive decoder", "type": "interactive", "url": "https://jwt.io"},
                 {"title": "OAuth 2.0 Playground", "type": "interactive", "url": "https://www.oauth.com/playground/"}],
                AUTH_S1_REVIEW,
                "You can explain the complete OAuth 2.0 Authorization Code + PKCE flow, decode and validate a JWT, and articulate why OIDC is needed on top of OAuth 2.0."
            ),
            session(2,
                "RBAC, mTLS, and Zero-Trust Security Architecture",
                "RBAC, mTLS, and zero-trust are standard requirements in senior system design interviews for any security-sensitive system.",
                "advanced", 55,
                "Your company has 50 microservices. How do you ensure that only Service A can call Service B — and that this is enforced cryptographically, not just by network firewall rules?",
                "Zero-trust is the modern security baseline. Understanding mTLS and RBAC is essential for designing systems that pass security review at any company with serious compliance requirements.",
                ["Implement RBAC and explain when to use ABAC instead",
                 "Explain mTLS handshake and when to use it",
                 "Apply zero-trust principles to a microservice architecture",
                 "Identify and mitigate common JWT and OAuth vulnerabilities"],
                AUTH_S2_CONTENT,
                ["RBAC is role-based; ABAC adds attribute context for fine-grained policies — use OPA for ABAC",
                 "mTLS provides cryptographic mutual authentication; standard TLS only authenticates the server",
                 "Zero-trust: never trust, always verify, least privilege, assume breach",
                 "Refresh token rotation detects theft: reuse of an already-rotated token triggers full session revocation",
                 "JWT alg:none is a critical vulnerability — always whitelist allowed algorithms"],
                [{"description": "Implement RBAC middleware that reads roles from JWT claims and enforces permissions on routes", "durationMinutes": 20},
                 {"description": "Sketch zero-trust architecture for a 5-service system with mTLS and a central auth service", "durationMinutes": 20},
                 {"description": "Answer review questions", "durationMinutes": 15}],
                [{"title": "Open Policy Agent (OPA)", "type": "docs", "url": "https://www.openpolicyagent.org/docs/latest/"},
                 {"title": "NIST Zero Trust Architecture SP 800-207", "type": "docs", "url": "https://csrc.nist.gov/publications/detail/sp/800-207/final"}],
                AUTH_S2_REVIEW,
                "You can design an auth architecture for a multi-service system using RBAC, mTLS, and zero-trust principles, and identify the top 5 JWT/OAuth vulnerabilities with their mitigations."
            ),
        ]
    },
    "quizBank": [
        q("What is the difference between OAuth 2.0 and OpenID Connect (OIDC)?",
          "multiple-choice", 3, "Understand",
          ["They are the same protocol with different names",
           "OAuth 2.0 handles authorization delegation; OIDC adds authentication (identity) on top of OAuth 2.0",
           "OIDC is for mobile apps; OAuth 2.0 is for web apps",
           "OAuth 2.0 uses JWTs; OIDC uses opaque tokens"],
          "OAuth 2.0 handles authorization delegation; OIDC adds authentication (identity) on top of OAuth 2.0",
          "OAuth 2.0 lets users delegate access (what the app can do). OIDC extends it with an id_token (JWT) that identifies who the user is. You need OIDC when you want to know the user's identity, not just grant access."),
        q("Why is Authorization Code + PKCE preferred over the Implicit grant for Single Page Applications?",
          "multiple-choice", 3, "Understand",
          ["It requires fewer round trips",
           "The Implicit flow exposes access tokens in the URL where they can be captured; PKCE prevents code interception",
           "PKCE works offline; Implicit requires an internet connection",
           "Authorization Code generates shorter tokens"],
          "The Implicit flow exposes access tokens in the URL where they can be captured; PKCE prevents code interception",
          "Implicit flow put tokens in the redirect URL fragment — visible in browser history, referrer headers, and server logs. Authorization Code + PKCE keeps tokens out of the URL and binds the code to a verifier only the legitimate client knows."),
        q("A JWT uses HS256 (HMAC-SHA256). What is the main security risk of this choice in a multi-service architecture?",
          "multiple-choice", 4, "Analyze",
          ["HS256 tokens are larger than RS256 tokens",
           "Every service that verifies tokens must share the same secret, increasing the attack surface",
           "HS256 does not support the exp claim",
           "HS256 tokens cannot be decoded at jwt.io"],
          "Every service that verifies tokens must share the same secret, increasing the attack surface",
          "HS256 uses a symmetric secret. Every service needing to verify tokens must know the secret — compromise of any one service exposes the signing key. RS256 uses asymmetric keys: only the auth server needs the private key; verifiers use the public key (safely distributable)."),
        q("What is the alg:none JWT vulnerability and how do you prevent it?",
          "multiple-choice", 3, "Remember",
          ["An attacker removes the signature and sets alg to none; some libraries skip verification for alg=none",
           "An attacker replaces RS256 with HS256 and uses the public key as the HMAC secret",
           "An attacker sets exp to none to create a non-expiring token",
           "An attacker removes the payload to create an empty token"],
          "An attacker removes the signature and sets alg to none; some libraries skip verification for alg=none",
          "alg:none: attacker crafts a token with algorithm=none and removes the signature. Vulnerable libraries accept it. Prevention: whitelist allowed algorithms in your JWT library configuration (e.g., algorithms=['RS256']); never accept alg=none."),
        q("Explain refresh token rotation and how it detects token theft.",
          "free-response", 4, "Understand", [],
          "On every refresh: issue a new access token AND a new refresh token; immediately invalidate the old refresh token. If an attacker steals a refresh token and uses it after the legitimate user has already refreshed, the stolen token is already invalidated. The system detects this reuse as a token theft signal and can revoke all sessions for that user.",
          "Refresh token rotation limits the window of attacker access even if a refresh token is stolen. Without rotation, a stolen refresh token provides indefinite access until the user changes their password."),
        q("What is mTLS and how does it differ from standard TLS?",
          "free-response", 3, "Understand", [],
          "Standard TLS: server presents a certificate; client verifies server identity. The client is anonymous to the server cryptographically. mTLS (Mutual TLS): both client and server present certificates; each verifies the other. This provides cryptographic proof of client identity, not just server identity. Used in service meshes (Istio), zero-trust architectures, and financial APIs.",
          "mTLS eliminates the need for API keys or bearer tokens for service-to-service auth — identity is proved by the TLS certificate itself."),
        q("What are the three pillars of zero-trust architecture?",
          "multiple-choice", 2, "Remember",
          ["Encrypt, Monitor, Patch",
           "Never trust always verify; Least privilege; Assume breach",
           "Authenticate, Authorize, Audit",
           "Perimeter, Detection, Response"],
          "Never trust always verify; Least privilege; Assume breach",
          "NIST SP 800-207 defines zero-trust around: (1) verify explicitly — authenticate and authorize using all available signals; (2) use least privilege access — minimum permissions, time-limited; (3) assume breach — design as if the network is already compromised."),
        q("When should you use ABAC instead of RBAC for authorization?",
          "free-response", 3, "Apply", [],
          "Use ABAC when RBAC becomes too coarse-grained for your access control requirements. RBAC works well when roles map cleanly to permission sets. ABAC is needed when access decisions require evaluating multiple attributes: user attributes (department, clearance), resource attributes (owner, classification), and environmental attributes (time of day, device posture). Example: 'editors can only edit posts they authored, during business hours, from approved devices' — this cannot be expressed in RBAC alone.",
          "OPA (Open Policy Agent) is the standard tool for implementing ABAC / policy-as-code in microservice architectures."),
    ]
}

# ═══════════════════════════════════════════════════════════════════════════════
# TOPIC 4 — Monitoring & Observability
# ═══════════════════════════════════════════════════════════════════════════════

OBS_S1_CONTENT = """\
## The Three Pillars of Observability

**Observability** is the ability to understand the internal state of a system from its external outputs. The three pillars:

```mermaid
graph LR
    M[Metrics<br/>What is happening<br/>Prometheus/Grafana]
    L[Logs<br/>What happened<br/>ELK Stack]
    T[Traces<br/>Where it happened<br/>Jaeger/Zipkin]

    M -->|alert on anomalies| A[On-call Engineer]
    L -->|investigate cause| A
    T -->|find root service| A
```

- **Metrics**: Numeric measurements over time (CPU %, request rate, error rate). Cheap to store, easy to alert on.
- **Logs**: Timestamped records of events (structured JSON preferred). Rich context, expensive at scale.
- **Traces**: End-to-end request tracking across services with timing. Essential for microservices.

---

## The Four Golden Signals (Google SRE)

Google's Site Reliability Engineering book defines four signals that, if measured well, cover most production issues:

| Signal | Description | Example Metric |
|---|---|---|
| **Latency** | Time to serve a request | p99 response time: 250ms |
| **Traffic** | Demand on the system | HTTP requests per second: 5,000 |
| **Errors** | Rate of failed requests | 5xx error rate: 0.1% |
| **Saturation** | How full the service is | CPU: 78%, queue depth: 1,200 |

**Why these four?** They directly answer: is the system slow? under load? failing? about to fall over?

---

## SLI, SLO, and SLA

```
SLA (contract) → SLO (internal target) → SLI (measurement)
```

- **SLI (Service Level Indicator)**: The actual measurement. "What fraction of requests complete in <200ms?"
- **SLO (Service Level Objective)**: The target. "99% of requests complete in <200ms over 30 days."
- **SLA (Service Level Agreement)**: The contractual commitment with consequences. "We guarantee 99.9% availability. Breach = credits."

**Error budget:**
```
Error budget = 1 - SLO
99.9% SLO → 0.1% error budget
= 43.8 minutes downtime per month allowed
= 8.76 hours per year
```

If you burn through your error budget, you stop feature development and focus on reliability.

---

## Prometheus + Grafana Stack

**Prometheus** scrapes metrics from instrumented services on a pull model. Stores as time-series data.

```yaml
# prometheus.yml — scrape configuration
scrape_configs:
  - job_name: 'api-service'
    scrape_interval: 15s
    static_configs:
      - targets: ['api:8080']  # Prometheus scrapes /metrics endpoint
```

**Instrumenting a service (Python):**
```python
from prometheus_client import Counter, Histogram, start_http_server

REQUEST_COUNT = Counter('http_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'Request latency',
                             buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0])

@app.middleware("http")
async def metrics_middleware(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    REQUEST_COUNT.labels(request.method, request.url.path, response.status_code).inc()
    REQUEST_LATENCY.observe(duration)
    return response
```

**PromQL — querying Prometheus:**
```promql
# Request rate over last 5 minutes
rate(http_requests_total[5m])

# 99th percentile latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Error rate as percentage
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# Alert: error rate > 1%
ALERT HighErrorRate
  IF rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
  FOR 5m
  LABELS { severity = "critical" }
```

---

## ELK Stack: Elasticsearch + Logstash + Kibana

- **Elasticsearch**: Distributed search and analytics engine — stores and indexes logs
- **Logstash**: Data ingestion pipeline — collects, transforms, ships logs
- **Kibana**: Visualisation layer — dashboards, log exploration, alerting

**Modern alternative:** Elasticsearch + Filebeat (lightweight log shipper) + Kibana (drop Logstash for simple pipelines)

**Structured logging (always use JSON):**
```python
import structlog

log = structlog.get_logger()

log.info("request_completed",
         user_id="user_123",
         endpoint="/api/checkout",
         duration_ms=142,
         status=200,
         trace_id="abc-123-def")
```

Structured logs are machine-parseable, filterable, and can be correlated with traces via `trace_id`."""

OBS_S1_REVIEW = [
    "What are the three pillars of observability and what question does each answer?:::Metrics: 'what is happening' — numeric measurements over time, cheap to store, easy to alert on. Logs: 'what happened' — timestamped event records with rich context. Traces: 'where it happened' — end-to-end request tracking across services showing which service is slow.",
    "What are the four golden signals and why were they chosen?:::Latency (how slow?), Traffic (how much load?), Errors (how many failures?), Saturation (how full?). They were chosen because together they answer the most important operational questions about a service's health and capacity.",
    "Define SLI, SLO, and SLA and give an example of each for a web API.:::SLI: actual measurement — 'fraction of requests completing in <200ms'. SLO: internal target — '99% of requests complete in <200ms over 30 days'. SLA: contractual commitment — 'we guarantee 99.9% uptime; breach triggers 25% service credit'.",
    "What is an error budget and how does it guide engineering decisions?:::Error budget = 1 - SLO. A 99.9% SLO gives 0.1% error budget = 43.8 minutes downtime/month. If the error budget is consumed, teams stop shipping new features and focus on reliability work. It turns an abstract SLO into a concrete resource that balances reliability vs feature velocity.",
]

OBS_S2_CONTENT = """\
## OpenTelemetry: Unified Observability

OpenTelemetry (OTel) is the CNCF standard for instrumenting applications. It provides a single SDK that exports metrics, logs, and traces to any backend (Jaeger, Prometheus, Datadog, etc.).

```mermaid
graph LR
    subgraph App
        SDK[OTel SDK]
    end
    SDK -->|OTLP| COL[OTel Collector]
    COL -->|metrics| PROM[Prometheus]
    COL -->|traces| JAEGER[Jaeger]
    COL -->|logs| ES[Elasticsearch]
```

**Tracing a FastAPI application:**
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Configure tracing
provider = TracerProvider()
exporter = OTLPSpanExporter(endpoint="http://otel-collector:4317")
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)

# Auto-instrument FastAPI (adds spans for every request)
FastAPIInstrumentor.instrument_app(app)

# Manual spans for custom operations
tracer = trace.get_tracer(__name__)

async def process_payment(order_id: str, amount: float):
    with tracer.start_as_current_span("process_payment") as span:
        span.set_attribute("order.id", order_id)
        span.set_attribute("payment.amount", amount)
        try:
            result = await payment_gateway.charge(amount)
            span.set_attribute("payment.status", "success")
            return result
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.StatusCode.ERROR, str(e))
            raise
```

**Trace context propagation** — the key to distributed tracing:
```python
# Outgoing HTTP call — propagate trace context
import httpx
from opentelemetry.propagate import inject

headers = {}
inject(headers)  # adds traceparent, tracestate headers
response = await httpx.AsyncClient().get("http://downstream-service/api", headers=headers)
```

This lets Jaeger stitch together a full distributed trace from multiple services.

---

## Alerting Strategy: Alert on Symptoms, Not Causes

**Bad alerts (cause-based):**
- CPU > 80% (might not affect users)
- Disk > 90% (might be normal for a logging server)
- Memory > 85% (JVMs run high normally)

**Good alerts (symptom-based, using golden signals):**
```yaml
# Prometheus alerting rules
groups:
  - name: golden-signals
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1.0
        for: 5m
        annotations:
          summary: "p99 latency >1s for 5 minutes"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 2m
        annotations:
          summary: "Error rate >1% for 2 minutes"

      - alert: ServiceDown
        expr: up{job="api-service"} == 0
        for: 1m
        annotations:
          summary: "API service scrape target is down"
```

**Alerting tiers:**
1. **Page immediately**: SLO breach imminent (error budget burning fast)
2. **Ticket**: Slow error budget burn (can wait until business hours)
3. **Dashboard/review**: Informational — review weekly

---

## Distributed Tracing Deep Dive

```mermaid
gantt
    dateFormat  SSS
    axisFormat %Lms
    title Request trace: POST /checkout

    section API Gateway
    auth-check      :0, 5
    route           :5, 2

    section Order Service
    validate-cart   :7, 15
    create-order    :22, 8

    section Payment Service
    charge-card     :30, 120

    section Inventory Service
    reserve-items   :30, 45

    section Email Service
    send-confirm    :150, 20
```

A trace shows the critical path: Payment Service at 120ms is the bottleneck, not Email Service (parallel).

**Key trace concepts:**
- **Trace**: One end-to-end request across services (has a `trace_id`)
- **Span**: One unit of work within a trace (has `span_id`, `parent_span_id`, start/end time)
- **Context propagation**: Passing `traceparent` header between services to link spans

---

## Observability in System Design Interviews

When designing any system, proactively address observability:

**"How would you monitor this?"**

Structure your answer around:

1. **Golden signal metrics**: What to measure for each service
2. **SLOs**: What availability/latency targets, what error budget
3. **Alerting**: Alert on SLO burn rate, not individual metrics
4. **Dashboards**: Per-service golden signals + business metrics side-by-side
5. **Runbooks**: For each alert, document diagnosis steps

**Error Budget Burn Rate Alerting (most sophisticated pattern):**
```promql
# Fast burn: consuming 2% of monthly budget in 1h → page immediately
(rate(http_requests_total{status=~"5.."}[1h]) / rate(http_requests_total[1h])) > 0.02

# Slow burn: consuming budget faster than allowed over 6h → ticket
(rate(http_requests_total{status=~"5.."}[6h]) / rate(http_requests_total[6h])) > 0.005
```

This is the Google SRE recommended alerting pattern: alert on the rate of SLO consumption, not the raw metric value."""

OBS_S2_REVIEW = [
    "What is OpenTelemetry and why is it preferred over vendor-specific instrumentation?:::OpenTelemetry is the CNCF standard SDK for metrics, logs, and traces. It is vendor-neutral — instrument once with OTel and export to any backend (Prometheus, Jaeger, Datadog, Honeycomb). Vendor-specific SDKs create lock-in: switching observability vendors requires re-instrumenting the entire application.",
    "What is context propagation in distributed tracing and why is it critical?:::Context propagation passes the trace ID and span ID between services via HTTP headers (traceparent header per W3C standard). Without it, each service creates an isolated trace and you cannot see the full picture of a cross-service request. With it, Jaeger/Zipkin stitches all spans into a single trace showing the complete request path and timing.",
    "What is the difference between alerting on causes (CPU %) vs symptoms (error rate)?:::Cause-based alerts (high CPU) fire often but do not indicate user impact — high CPU might be normal. Symptom-based alerts (high error rate, high latency) directly measure user experience. Alert on symptoms to reduce alert fatigue and ensure every alert represents a real user-visible problem.",
    "Explain error budget burn rate alerting and why it is better than threshold-based alerting.:::Burn rate alerting measures how fast you are consuming your error budget, not just whether a metric crossed a threshold. Fast burn (2% of monthly budget in 1 hour) pages immediately — the service will breach SLO soon. Slow burn (budget being consumed at 5× normal rate over 6 hours) creates a ticket for business hours. This prevents both under-alerting (missing slow degradation) and over-alerting (paging on transient spikes).",
]

monitoring = {
    "topic": "Monitoring & Observability",
    "category": "System Design",
    "cheatSheet": """\
# Monitoring & Observability Cheat Sheet

## Three Pillars
- **Metrics**: what is happening (Prometheus, numeric, cheap)
- **Logs**: what happened (ELK, structured JSON, rich context)
- **Traces**: where it happened (Jaeger/OTel, cross-service, timing)

## Four Golden Signals
| Signal | Alert Threshold Example |
|---|---|
| Latency | p99 > 500ms for 5min |
| Traffic | RPS drops 50% suddenly |
| Errors | 5xx rate > 1% for 2min |
| Saturation | CPU > 90% for 10min |

## SLI / SLO / SLA
```
SLI: fraction of requests < 200ms
SLO: 99% of requests < 200ms (30-day window)
SLA: 99.9% uptime guaranteed (breach = credits)

Error budget = 1 - SLO = 0.1% = 43.8 min/month
```

## PromQL Essentials
```promql
# Request rate
rate(http_requests_total[5m])

# p99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Error rate %
rate(http_requests_total{status=~"5.."}[5m])
/ rate(http_requests_total[5m]) * 100
```

## OpenTelemetry Quick Setup
```python
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
FastAPIInstrumentor.instrument_app(app)
# Auto-instruments all routes with traces
```

## Alerting Rules
- Alert on SYMPTOMS (latency, errors) not CAUSES (CPU, memory)
- Fast burn rate → page immediately
- Slow burn rate → ticket for business hours
- No SLO breach → dashboard/weekly review only

## ELK Stack
- Elasticsearch: stores + indexes logs
- Logstash / Filebeat: ships logs from services
- Kibana: dashboards + log search

## Structured Logging (always JSON)
```python
log.info("event", user_id=uid, duration_ms=142, trace_id=tid)
```""",
    "resources": [
        resource("Site Reliability Engineering (SRE Book)", "Google", "books",
                 "Chapters on SLIs/SLOs/SLAs and the four golden signals are the canonical reference",
                 "Engineers learning SRE principles", "15 hours", "Free online", "HIGH",
                 "https://sre.google/sre-book/table-of-contents/"),
        resource("Prometheus Documentation", "CNCF", "docs",
                 "Official Prometheus docs covering data model, PromQL, and alerting",
                 "Engineers instrumenting services with Prometheus", "4 hours", "Free", "HIGH",
                 "https://prometheus.io/docs/introduction/overview/"),
        resource("OpenTelemetry Documentation", "CNCF", "docs",
                 "Official OTel getting started and SDK reference for multiple languages",
                 "Engineers adding distributed tracing", "3 hours", "Free", "HIGH",
                 "https://opentelemetry.io/docs/"),
        resource("Observability Engineering", "Majors, Fong-Jones, Miranda", "books",
                 "Modern observability engineering with structured events, distributed tracing, and high-cardinality analysis",
                 "Senior engineers building observability platforms", "12 hours", "~$40", "HIGH"),
    ],
    "ladder": {"levels": [
        level(1, "Novice", "Novice",
              "Understands what monitoring is and why it matters",
              ["Knows difference between metrics, logs, and traces", "Can read a Grafana dashboard", "Understands uptime/availability concepts"],
              "Basic Health Dashboard",
              "Instrument a simple web app with Prometheus metrics; create a Grafana dashboard showing request rate and error rate",
              4, ["Confusing monitoring with observability", "Alert fatigue from threshold-based alerts"], 6,
              ["Basic Linux familiarity", "One programming language"]),
        level(2, "Advanced Beginner", "Advanced Beginner",
              "Instruments services and writes meaningful alerts",
              ["Instruments HTTP services with golden signal metrics", "Writes PromQL queries for rate and histogram_quantile", "Creates structured logs with trace_id correlation"],
              "Golden Signals Dashboard + Alerts",
              "Instrument a 2-service system with Prometheus, create Grafana dashboards for all four golden signals, add alerting rules for error rate and latency",
              12, ["Alerting on causes instead of symptoms", "Not using structured logging"], 25,
              ["Docker/Kubernetes basics", "Basic Prometheus familiarity"]),
        level(3, "Competent", "Competent",
              "Implements distributed tracing and designs SLOs for production services",
              ["Adds distributed tracing with OTel across multiple services", "Defines SLIs and SLOs with error budgets", "Implements log correlation with trace IDs"],
              "Full Observability Stack",
              "Set up Prometheus + Grafana + Jaeger with OTel for a 3-service application; define SLOs with error budget dashboards",
              25, ["Trace context propagation breaking at service boundaries", "SLO too aggressive burning budget too fast"], 50,
              ["Prometheus + Grafana experience", "Microservice architecture understanding"]),
        level(4, "Proficient", "Proficient",
              "Designs observability strategy for large distributed systems",
              ["Implements burn rate alerting based on SLO consumption", "Designs multi-service tracing with sampling strategy", "Optimises observability cost at scale (log sampling, metric cardinality)"],
              "SLO-Based Alerting Platform",
              "Implement error budget burn rate alerting for a 10-service system; design a sampling strategy that retains 100% of error traces while sampling 1% of success traces",
              40, ["Observability cost explosion from high-cardinality labels", "Sampling discarding important error traces"], 80,
              ["Production SRE/monitoring experience", "PromQL proficiency"]),
        level(5, "Expert", "Expert",
              "Architects observability platforms for internet-scale systems",
              ["Designs multi-region observability with global dashboards", "Evaluates build-vs-buy for observability infrastructure", "Defines SLOs across complex multi-party service dependencies"],
              "Enterprise Observability Platform",
              "Design a unified observability platform for 100+ microservices across 3 regions with SLO tracking, cost management, and on-call workflow integration",
              100, ["Observability infrastructure itself becoming a reliability risk", "Cultural resistance to SLO ownership"], 200,
              ["Senior SRE or platform engineering experience", "Large-scale distributed systems experience"]),
    ]},
    "plan": {
        "overview": "Master monitoring and observability from metrics basics to production-grade distributed tracing and SLO-based alerting, covering Prometheus, ELK, OpenTelemetry, and Google SRE patterns.",
        "skippedTopics": "Specific APM vendor products (Datadog, New Relic) configuration details, chaos engineering, AIOps/anomaly detection",
        "sessions": [
            session(1,
                "The Three Pillars, Golden Signals, and SLI/SLO/SLA",
                "SLOs and the four golden signals form the foundation of every SRE interview and production monitoring discussion.",
                "intermediate", 50,
                "Your service has been having intermittent issues for 3 weeks. Users complain, but your CPU and memory dashboards look normal. What are you measuring wrong?",
                "Poor observability is the root cause of most extended production incidents. Engineers who understand SLOs and golden signals can detect, diagnose, and resolve incidents faster and more reliably.",
                ["Explain the three pillars of observability and what each answers",
                 "List the four golden signals and write PromQL queries for each",
                 "Define SLI, SLO, and SLA with concrete examples",
                 "Calculate error budget from an SLO and explain how it guides engineering decisions"],
                OBS_S1_CONTENT,
                ["Metrics/Logs/Traces each answer a different question — use all three together",
                 "Alert on the four golden signals (latency, traffic, errors, saturation), not on infrastructure causes",
                 "SLI is the measurement, SLO is the target, SLA is the contract",
                 "Error budget = 1 - SLO; consuming it stops features, forces reliability work",
                 "Structured JSON logs are essential — unstructured logs cannot be queried or correlated with traces"],
                [{"description": "Instrument a simple HTTP server with Prometheus metrics for all four golden signals", "durationMinutes": 20},
                 {"description": "Define SLI and SLO for a hypothetical payments API; calculate its monthly error budget in minutes", "durationMinutes": 10},
                 {"description": "Write PromQL queries for error rate and p99 latency", "durationMinutes": 10},
                 {"description": "Answer review questions", "durationMinutes": 10}],
                [{"title": "Google SRE Book — SLOs chapter", "type": "article", "url": "https://sre.google/sre-book/service-level-objectives/"},
                 {"title": "Prometheus getting started", "type": "docs", "url": "https://prometheus.io/docs/prometheus/latest/getting_started/"}],
                OBS_S1_REVIEW,
                "You can list the four golden signals, write PromQL for each, define SLI/SLO/SLA with examples, and calculate error budget from an SLO target."
            ),
            session(2,
                "OpenTelemetry, Distributed Tracing, and Production Alerting Strategy",
                "Distributed tracing and SLO-based alerting are the most advanced observability skills and appear in senior-level system design discussions.",
                "advanced", 55,
                "A checkout request takes 2 seconds. Your API gateway logs show the request came in and a response went out. But which of your 8 downstream services caused the 2-second delay?",
                "In a microservice architecture, a single user request touches dozens of services. Without distributed tracing, diagnosing latency is guesswork. OpenTelemetry is now the industry standard for solving this.",
                ["Instrument a multi-service application with OpenTelemetry for distributed tracing",
                 "Explain trace context propagation and why it is essential",
                 "Design an alerting strategy using error budget burn rates",
                 "Architect a complete observability stack for a production system"],
                OBS_S2_CONTENT,
                ["OpenTelemetry is vendor-neutral — instrument once, export to any backend",
                 "Context propagation (traceparent header) links spans across services into a single trace",
                 "Alert on symptoms (error rate, latency) not causes (CPU, disk); alert on SLO burn rate not raw values",
                 "Fast burn rate (paging) + slow burn rate (ticket) covers both acute and gradual degradation",
                 "Traces reveal the critical path — the slowest sequential operation, not just the slowest service"],
                [{"description": "Add OTel tracing to a 2-service application; verify traces appear in Jaeger UI", "durationMinutes": 25},
                 {"description": "Write Prometheus alerting rules for fast and slow SLO burn rates", "durationMinutes": 15},
                 {"description": "Answer review questions", "durationMinutes": 15}],
                [{"title": "OpenTelemetry Python docs", "type": "docs", "url": "https://opentelemetry.io/docs/languages/python/"},
                 {"title": "Google SRE — Alerting on SLOs", "type": "article", "url": "https://sre.google/workbook/alerting-on-slos/"}],
                OBS_S2_REVIEW,
                "You can instrument a multi-service application with OTel, explain trace context propagation, and design an SLO-based alerting strategy with fast and slow burn rates."
            ),
        ]
    },
    "quizBank": [
        q("What are the four golden signals defined by Google SRE?",
          "multiple-choice", 2, "Remember",
          ["CPU, Memory, Disk, Network",
           "Latency, Traffic, Errors, Saturation",
           "Availability, Reliability, Performance, Capacity",
           "P50, P95, P99, P999"],
          "Latency, Traffic, Errors, Saturation",
          "The four golden signals from Google's SRE book: Latency (how slow), Traffic (how much demand), Errors (how many failures), Saturation (how full). They directly measure user-visible service health."),
        q("A service has a 99.9% availability SLO. How many minutes of downtime are allowed per month?",
          "multiple-choice", 2, "Apply",
          ["1 minute", "43.8 minutes", "4.38 hours", "87.6 minutes"],
          "43.8 minutes",
          "Error budget = 1 - 0.999 = 0.1%. Month = 43,800 minutes. 0.001 × 43,800 = 43.8 minutes. This is the allowed downtime budget for the month."),
        q("What is the difference between an SLI, SLO, and SLA?",
          "free-response", 3, "Understand", [],
          "SLI (Service Level Indicator): the actual measurement — e.g., 'fraction of requests completing in <200ms'. SLO (Service Level Objective): the internal target — '99% of requests complete in <200ms over 30 days'. SLA (Service Level Agreement): the contractual commitment with consequences — '99.9% availability guaranteed; breach triggers 25% service credit'.",
          "SLIs are what you measure, SLOs are what you target internally, SLAs are what you promise externally with contractual consequences."),
        q("What is OpenTelemetry and why is it preferred over vendor-specific monitoring SDKs?",
          "multiple-choice", 3, "Understand",
          ["A paid observability platform by Google",
           "A vendor-neutral CNCF standard for metrics, logs, and traces that exports to any backend",
           "A replacement for Prometheus that uses push instead of pull",
           "A Kubernetes-specific monitoring solution"],
          "A vendor-neutral CNCF standard for metrics, logs, and traces that exports to any backend",
          "OpenTelemetry is vendor-neutral: instrument your application once with the OTel SDK and export to Prometheus, Jaeger, Datadog, Honeycomb, or any OTLP-compatible backend. Switching vendors does not require re-instrumenting your code."),
        q("What is trace context propagation and why is it essential for distributed tracing?",
          "free-response", 4, "Understand", [],
          "Context propagation passes the trace ID and parent span ID between services via HTTP headers (W3C traceparent header standard). Without it, each service generates an isolated trace with no connection to the others — you cannot see the full picture of a cross-service request. With it, a distributed tracing system (Jaeger, Zipkin) stitches all spans into a single trace showing the complete request path, timing, and which service caused latency.",
          "The traceparent header format: 00-{trace_id}-{parent_span_id}-{flags}. OpenTelemetry's propagators handle injection and extraction automatically."),
        q("Why should you alert on symptoms (error rate, latency) rather than causes (CPU usage, memory)?",
          "multiple-choice", 3, "Evaluate",
          ["Symptom alerts are easier to configure in Prometheus",
           "Cause metrics like CPU do not have meaningful thresholds — symptoms directly measure user experience",
           "Infrastructure metrics cannot be collected without an agent",
           "Cause-based alerts fire too rarely"],
          "Cause metrics like CPU do not have meaningful thresholds — symptoms directly measure user experience",
          "High CPU might be normal (batch processing). High memory might be expected (JVM). But high error rate always means users are failing. Alert on what users experience, not internal resource usage. This reduces alert fatigue and ensures every alert represents a real problem."),
        q("What is error budget burn rate alerting and how does it improve on simple threshold alerts?",
          "free-response", 4, "Evaluate", [],
          "Burn rate alerting measures how fast the monthly error budget is being consumed. A fast burn (e.g., 2% of monthly budget consumed in 1 hour) triggers an immediate page — the SLO will be breached soon. A slow burn (consuming budget 5x faster than sustainable over 6 hours) creates a ticket for business hours. Simple threshold alerts (error rate > 1%) miss gradual degradation and generate false positives on transient spikes. Burn rate alerts detect both acute and gradual SLO risk.",
          "This is the Google SRE recommended alerting pattern described in the SRE Workbook chapter 'Alerting on SLOs'."),
        q("What is the difference between metrics, logs, and traces in an observability system?",
          "multiple-choice", 2, "Understand",
          ["They are three names for the same thing — timestamped data",
           "Metrics are numeric aggregates over time; logs are timestamped event records; traces track a request end-to-end across services",
           "Metrics are for errors; logs are for performance; traces are for availability",
           "Logs replace metrics in modern observability; traces are only for databases"],
          "Metrics are numeric aggregates over time; logs are timestamped event records; traces track a request end-to-end across services",
          "Each pillar answers a different question: metrics (what is happening now, cheap to store), logs (what exactly happened with full context, expensive at scale), traces (which service in the call chain is slow or failing, essential for microservices)."),
    ]
}

# ═══════════════════════════════════════════════════════════════════════════════
# Write output
# ═══════════════════════════════════════════════════════════════════════════════

topics = [cdn, rate_limiting, auth, monitoring]
output = json.dumps(topics, indent=2, ensure_ascii=False)
OUT.write_text(output, encoding="utf-8")

print(f"Written {len(output):,} bytes to {OUT}")
print(f"Topics: {[t['topic'] for t in topics]}")
for t in topics:
    s = t['plan']['sessions']
    q = t['quizBank']
    print(f"  {t['topic']}: {len(s)} sessions, {len(q)} quiz questions, {len(t['ladder']['levels'])} ladder levels")
PYEOF
