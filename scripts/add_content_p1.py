#!/usr/bin/env python3
"""Part 1: URL Shortener sessions 1-5"""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json"

with open(PATH) as f:
    data = json.load(f)

# Find URL Shortener (index 0)
idx = next(i for i, d in enumerate(data) if "URL Shortener" in d["topic"])

sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## Session 1: Requirements & Scope

The first 5 minutes of any system design interview are the most important. You must drive the conversation from vague to precise. Interviewers deliberately give open-ended questions to see if you can ask the right clarifying questions.

### The Opening Move

**Interviewer:** "Design a URL shortener like TinyURL."

**Candidate:** "Great. Before I dive in, I'd like to clarify the requirements. Can I ask a few questions?"

This single sentence signals maturity. Never start drawing boxes immediately.

---

### Functional Requirements

Ask and confirm:

1. **Core feature:** Given a long URL, generate a short URL. Given a short URL, redirect to the original.
2. **Custom aliases:** Can users choose their own short code? (e.g., `tinyurl.com/my-brand`)
3. **Expiration:** Do links expire? User-configurable or system default?
4. **Analytics:** Do we track click counts, geo, referrer?
5. **Authentication:** Do users need accounts? Anonymous links?

**Candidate statement:** "For this interview, I'll focus on: URL shortening, redirection, optional custom aliases, optional TTL, and basic click analytics. I'll skip OAuth and billing."

**Interview tip:** Explicitly state what you're *not* building. This shows you understand scope management.

---

### Non-Functional Requirements

These are often more important than functional ones for system design:

| Requirement | Target | Reasoning |
|---|---|---|
| Availability | 99.99% | Broken short links = lost revenue for customers |
| Read latency | < 10ms P99 | Redirection is in the critical path of page loads |
| Write latency | < 100ms P99 | Link creation is async-tolerant |
| Durability | 0 data loss | Links must never silently disappear |
| Consistency | Eventual OK | A new link visible within 1s is acceptable |

**Key non-functional:** **reads must be extremely fast** — every click goes through the shortener.

---

### Scale Assumptions

Pin down scale early. Interviewers will probe this.

```
Daily Active Users: 100M
Links created per day: 100M / 10 = 10M (estimate: 1 in 10 users creates a link)
Links clicked per day: 100M * 10 = 1B (estimate: each link clicked 100x on average)
Read:Write ratio = 100:1
```

**Candidate:** "I'm assuming a heavily read-skewed system — 100:1 read to write. This drives my caching strategy significantly."

---

### Clarifying Questions Checklist

Use this in interviews:

- [ ] How many URLs shortened per day? Per second?
- [ ] How many redirects per day?
- [ ] How long should short URLs be? (5-8 characters is standard)
- [ ] Should short URLs be random or sequential?
- [ ] Global or single-region?
- [ ] What's the retention period? Forever?

**Interviewer:** "Why does the read:write ratio matter to you?"

**Candidate:** "Because at 100:1, I'll design the read path to be served entirely from cache — Redis in front of the database. The write path can tolerate more latency since it's 100x less frequent. This simplifies the architecture: I can use a single write leader with many read replicas, and the cache hit rate will be near 99%."

---

### Summary of Scope

> **In scope:** Shorten URL, redirect, custom alias, TTL, click count
> **Out of scope:** User accounts, billing, A/B testing, QR codes
> **Scale:** 10M writes/day, 1B reads/day, 99.99% availability
> **Constraints:** 8-char short codes, global, links live forever by default
""",

2: """## Session 2: Capacity Estimation

Capacity estimation is where you demonstrate engineering rigor. Do it on paper/whiteboard with real numbers. Interviewers want to see your mental math, not a calculator.

### Traffic Estimation

```
Writes (URL creation):
  10M links/day
  = 10,000,000 / 86,400 seconds
  ≈ 116 writes/second (peak: ~3x = 350 writes/second)

Reads (URL redirection):
  1B clicks/day
  = 1,000,000,000 / 86,400
  ≈ 11,574 reads/second (peak: ~3x = 35,000 reads/second)

Read:Write ratio = 100:1
```

**Interview tip:** Always calculate peak. Systems must handle 3x average load for traffic spikes.

---

### Storage Estimation

```
Per URL record:
  short_code:   7 bytes
  long_url:     200 bytes (average)
  created_at:   8 bytes (timestamp)
  expires_at:   8 bytes
  user_id:      8 bytes
  click_count:  8 bytes
  ─────────────────────
  Total:        ~250 bytes per record

Links created per year:
  10M/day * 365 = 3.65 billion records

Storage for 10 years:
  3.65B * 10 * 250 bytes = 9.125 TB

With 3x replication: ~27 TB
```

This fits comfortably on modern SSDs. No sharding needed for storage alone.

---

### Cache Estimation

The 80/20 rule applies: 20% of links get 80% of traffic.

```
Hot links in cache:
  35,000 peak reads/second
  Average object size: 250 bytes
  Cache for top 20% of daily links: 0.2 * 10M * 250B = 500 MB

Redis memory: 2 GB (comfortable buffer, cheap)
Cache hit rate target: 99%
```

**Candidate:** "With a 2GB Redis cache holding the hottest 20% of links, I expect 99%+ cache hits. The database sees only 350 reads/second instead of 35,000 — a 100x reduction."

---

### Bandwidth Estimation

```
Inbound (writes):
  350 writes/sec * 200 bytes = 70 KB/s (negligible)

Outbound (reads):
  35,000 reads/sec * 200 bytes = 7 MB/s

With HTTP 301 redirect headers (~500 bytes):
  35,000 * 500 = 17.5 MB/s outbound
```

Very manageable. A single 1Gbps NIC handles this trivially. The concern is latency, not bandwidth.

---

### Short Code Space

How many unique short codes can we generate?

```
Character set: a-z, A-Z, 0-9 = 62 characters
Code length: 7 characters
Possible codes: 62^7 = 3.52 trillion

At 10M new links/day:
  3.52T / 10M = 352,000 days = ~964 years of unique codes
```

**Interviewer:** "Why 7 characters and not 6?"

**Candidate:** "62^6 gives us 56 billion codes — about 15 years at our scale. 7 characters gives 3.5 trillion, which is effectively unlimited. The extra character costs 1 byte per record — totally worth the headroom."

---

### Summary Table

| Metric | Value |
|---|---|
| Write QPS (avg) | 116/s |
| Write QPS (peak) | 350/s |
| Read QPS (avg) | 11,574/s |
| Read QPS (peak) | 35,000/s |
| Storage (10yr) | 9 TB raw |
| Cache size | 2 GB Redis |
| Short code space | 3.52 trillion |
| Bandwidth out | ~17.5 MB/s |

**Interview tip:** Present this as a table. Interviewers take notes. A structured table is easier to absorb than stream-of-consciousness arithmetic.
""",

3: """## Session 3: API Design

API design reveals how you think about contracts between systems. A good API is intuitive, versioned, and handles errors gracefully.

### REST API Principles for Interviews

1. Use nouns, not verbs, in paths (`/urls`, not `/createUrl`)
2. Use HTTP methods semantically (POST to create, GET to read, DELETE to remove)
3. Always version your API (`/v1/`)
4. Return consistent error envelopes
5. Design for the client, not the database

---

### Endpoint 1: Create Short URL

```http
POST /v1/urls
Content-Type: application/json
Authorization: Bearer {token}  (optional)

{
  "long_url": "https://www.example.com/very/long/path?with=params&and=more",
  "custom_alias": "my-brand",          // optional
  "expires_at": "2025-12-31T23:59:59Z" // optional, ISO 8601
}
```

**Response 201 Created:**
```json
{
  "short_url": "https://tinyurl.com/aB3xK9m",
  "short_code": "aB3xK9m",
  "long_url": "https://www.example.com/very/long/path?with=params&and=more",
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": null
}
```

**Error responses:**
```json
// 400 Bad Request - invalid URL
{ "error": "INVALID_URL", "message": "The provided URL is not valid." }

// 409 Conflict - custom alias taken
{ "error": "ALIAS_TAKEN", "message": "The alias 'my-brand' is already in use." }

// 422 Unprocessable - URL blocked
{ "error": "URL_BLOCKED", "message": "This URL has been flagged as malicious." }
```

---

### Endpoint 2: Redirect (The Core Read Path)

```http
GET /{short_code}
```

**Response 301 Moved Permanently** (cacheable by browsers):
```
HTTP/1.1 301 Moved Permanently
Location: https://www.example.com/very/long/path?with=params&and=more
Cache-Control: max-age=3600
```

**OR Response 302 Found** (not cached — needed for analytics):
```
HTTP/1.1 302 Found
Location: https://www.example.com/very/long/path
```

**Interview gold:** "Interviewer: 301 vs 302?"

**Candidate:** "301 is permanent and browsers cache it — reduces load on our servers but we lose click tracking. 302 is temporary, browsers always re-request, we get every click. I'd use 302 for analytics-enabled links and 301 for anonymous links to reduce server load. This is a product decision masquerading as a technical one."

---

### Endpoint 3: Get URL Info / Analytics

```http
GET /v1/urls/{short_code}
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "short_code": "aB3xK9m",
  "short_url": "https://tinyurl.com/aB3xK9m",
  "long_url": "https://www.example.com/...",
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": null,
  "analytics": {
    "total_clicks": 15234,
    "unique_clicks": 8901,
    "clicks_last_24h": 342,
    "top_countries": ["US", "IN", "GB"],
    "top_referrers": ["twitter.com", "reddit.com"]
  }
}
```

---

### Endpoint 4: Delete URL

```http
DELETE /v1/urls/{short_code}
Authorization: Bearer {token}
```

**Response 204 No Content** (success, no body)

---

### Python Implementation Sketch

```python
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

app = FastAPI()

class CreateURLRequest(BaseModel):
    long_url: HttpUrl
    custom_alias: Optional[str] = None
    expires_at: Optional[datetime] = None

class URLResponse(BaseModel):
    short_url: str
    short_code: str
    long_url: str
    created_at: datetime
    expires_at: Optional[datetime]

@app.post("/v1/urls", response_model=URLResponse, status_code=201)
async def create_short_url(
    request: CreateURLRequest,
    authorization: Optional[str] = Header(None)
):
    # Validate URL (basic check, more in service layer)
    if not is_safe_url(str(request.long_url)):
        raise HTTPException(status_code=422, detail={
            "error": "URL_BLOCKED",
            "message": "This URL has been flagged as malicious."
        })

    # Delegate to service
    result = await url_service.create(
        long_url=str(request.long_url),
        custom_alias=request.custom_alias,
        expires_at=request.expires_at,
        user_id=extract_user_id(authorization)
    )
    return result

@app.get("/{short_code}")
async def redirect(short_code: str):
    url = await url_service.resolve(short_code)
    if not url:
        raise HTTPException(status_code=404, detail="Short URL not found")
    if url.is_expired():
        raise HTTPException(status_code=410, detail="This link has expired")

    # Fire-and-forget analytics
    background_tasks.add_task(analytics.record_click, short_code)

    return RedirectResponse(url.long_url, status_code=302)
```

---

### TypeScript / Next.js Route Handler

```typescript
// app/api/v1/urls/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Validate
  if (!body.long_url || !isValidURL(body.long_url)) {
    return NextResponse.json(
      { error: 'INVALID_URL', message: 'The provided URL is not valid.' },
      { status: 400 }
    )
  }

  const shortCode = body.custom_alias ?? generateShortCode()

  // Check uniqueness
  const existing = await db.urls.findByCode(shortCode)
  if (existing) {
    return NextResponse.json(
      { error: 'ALIAS_TAKEN', message: `The alias '${shortCode}' is already in use.` },
      { status: 409 }
    )
  }

  const record = await db.urls.create({
    shortCode,
    longUrl: body.long_url,
    expiresAt: body.expires_at ?? null,
    createdAt: new Date(),
  })

  return NextResponse.json({
    short_url: `https://tinyurl.com/${record.shortCode}`,
    short_code: record.shortCode,
    long_url: record.longUrl,
    created_at: record.createdAt,
    expires_at: record.expiresAt,
  }, { status: 201 })
}
```

---

### Rate Limiting Headers

Always include rate limit headers — interviewers love this detail:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705312800
```
""",

4: """## Session 4: Database Schema

Database design is where many candidates lose points. You need to choose the right database, define schemas with proper types and indexes, and justify your choices.

### Database Selection

**Interviewer:** "Which database would you use?"

**Candidate:** "Let me think through the access patterns:

1. Primary read: look up long URL by short code — point lookup by primary key
2. Primary write: insert new URL record
3. Secondary: look up by user_id to list their links
4. Analytics: aggregate click counts over time

For the URL mapping itself, I want: high read throughput, simple key-value lookup, durability. PostgreSQL is a solid choice — it handles our scale (35K reads/sec) well with proper indexing and connection pooling via PgBouncer. Alternatively, DynamoDB gives us managed scaling with single-digit millisecond reads.

I'll go with PostgreSQL for the primary store and Redis for the cache layer."

---

### Primary Schema: PostgreSQL

```sql
-- Core URL mapping table
CREATE TABLE urls (
    id            BIGSERIAL PRIMARY KEY,
    short_code    VARCHAR(10)  NOT NULL UNIQUE,
    long_url      TEXT         NOT NULL,
    user_id       BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ,
    click_count   BIGINT       NOT NULL DEFAULT 0,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,

    -- Metadata
    title         VARCHAR(500),  -- scraped from og:title
    ip_address    INET,          -- creator's IP for abuse detection

    CONSTRAINT short_code_format CHECK (short_code ~ '^[a-zA-Z0-9_-]+$')
);

-- Critical index: the HOT path — every redirect does this lookup
CREATE UNIQUE INDEX idx_urls_short_code ON urls(short_code);

-- For "list my links" feature
CREATE INDEX idx_urls_user_id ON urls(user_id, created_at DESC);

-- For expiration cleanup job
CREATE INDEX idx_urls_expires_at ON urls(expires_at)
    WHERE expires_at IS NOT NULL AND is_active = TRUE;

-- Users table (simplified)
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    api_key       VARCHAR(64)  UNIQUE,  -- hashed
    plan          VARCHAR(20)  NOT NULL DEFAULT 'free'
);

-- Click analytics (separate table to avoid lock contention on urls)
CREATE TABLE clicks (
    id            BIGSERIAL PRIMARY KEY,
    short_code    VARCHAR(10)  NOT NULL,
    clicked_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    country_code  VARCHAR(2),
    city          VARCHAR(100),
    referrer      TEXT,
    user_agent    TEXT,
    ip_hash       VARCHAR(64)  -- hashed for privacy
) PARTITION BY RANGE (clicked_at);

-- Monthly partitions for clicks (auto-archivable)
CREATE TABLE clicks_2024_01 PARTITION OF clicks
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

### Why Separate the Clicks Table?

**Interviewer:** "Why not just increment click_count on the urls table?"

**Candidate:** "Two reasons:

1. **Lock contention:** If 35,000 requests/second all try to `UPDATE urls SET click_count = click_count + 1 WHERE short_code = 'abc'`, we'll have massive write contention on hot rows. This is a well-known PostgreSQL hot row problem.

2. **Granularity:** A separate clicks table lets us do time-series analytics — clicks by hour, by country, by referrer. Just a counter gives us nothing useful.

My solution: update click_count in Redis atomically (`INCR` is O(1) and thread-safe), then batch-flush to PostgreSQL every 60 seconds with a background job. The separate clicks table handles detailed analytics with table partitioning for manageability."

---

### Redis Schema

```
# URL cache: most frequently accessed pattern
Key:   url:{short_code}
Value: JSON blob {long_url, expires_at, is_active}
TTL:   3600 seconds (1 hour, refreshed on access)

# Click counter (batched flush to DB)
Key:   clicks:{short_code}
Value: integer counter
TTL:   none (explicit flush)

# Rate limiting
Key:   ratelimit:{ip}:{minute}
Value: integer counter
TTL:   60 seconds

# Custom alias reservation (distributed lock)
Key:   alias_lock:{short_code}
Value: 1
TTL:   5 seconds (NX SET with TTL)
```

---

### Index Strategy Explained

```sql
-- Why UNIQUE INDEX on short_code (not just UNIQUE constraint)?
-- In PostgreSQL, UNIQUE constraint creates an index automatically.
-- Explicitly naming it lets us reference it in query plans and
-- use index-only scans.

-- Query plan for redirect path:
EXPLAIN (ANALYZE, BUFFERS)
SELECT long_url, expires_at, is_active
FROM urls
WHERE short_code = 'aB3xK9m';

-- Expected plan:
-- Index Only Scan using idx_urls_short_code on urls
-- Index Cond: (short_code = 'aB3xK9m')
-- Heap Fetches: 0  ← index-only scan, no heap access needed
```

---

### NoSQL Alternative: DynamoDB

```python
# DynamoDB table design (single-table)
table_name = "urls"

# Primary key
partition_key = "PK"  # value: URL#{short_code}
sort_key = "SK"       # value: META

# GSI for user's links
gsi_pk = "GSI1PK"    # value: USER#{user_id}
gsi_sk = "GSI1SK"    # value: CREATED#{iso_timestamp}

# Example item
{
    "PK": "URL#aB3xK9m",
    "SK": "META",
    "long_url": "https://example.com/...",
    "created_at": "2024-01-15T10:30:00Z",
    "expires_at": None,
    "GSI1PK": "USER#12345",
    "GSI1SK": "CREATED#2024-01-15T10:30:00Z",
    "click_count": 15234,
    "TTL": 1735689600  # Unix timestamp for DynamoDB TTL
}
```

**Trade-off:** DynamoDB gives automatic scaling and managed infrastructure. PostgreSQL gives richer query capabilities and transactions. For a URL shortener, either works — I'd choose based on team expertise and existing infrastructure.
""",

5: """## Session 5: High-Level Architecture

Now you draw the system. This is the moment where you synthesize everything from sessions 1-4 into a coherent diagram. Take your time — a messy diagram loses you points.

### The Full System

```mermaid
graph TB
    Client([Browser / App])

    subgraph Edge ["Edge Layer"]
        CDN[CDN<br/>CloudFront]
        LB[Load Balancer<br/>AWS ALB]
    end

    subgraph AppLayer ["Application Layer"]
        WS1[Web Server 1<br/>FastAPI]
        WS2[Web Server 2<br/>FastAPI]
        WS3[Web Server 3<br/>FastAPI]
    end

    subgraph CacheLayer ["Cache Layer"]
        Redis1[Redis Primary<br/>URL Cache]
        Redis2[Redis Replica<br/>Read Scale]
    end

    subgraph DataLayer ["Data Layer"]
        PG_W[PostgreSQL<br/>Primary Write]
        PG_R1[PostgreSQL<br/>Read Replica 1]
        PG_R2[PostgreSQL<br/>Read Replica 2]
    end

    subgraph Async ["Async Processing"]
        Queue[Message Queue<br/>Kafka]
        Worker[Analytics Worker]
        ClickDB[(ClickHouse<br/>Analytics)]
    end

    Client --> CDN
    CDN --> LB
    LB --> WS1 & WS2 & WS3
    WS1 & WS2 & WS3 --> Redis1
    Redis1 --> Redis2
    WS1 & WS2 & WS3 --> PG_W
    WS1 & WS2 & WS3 --> PG_R1 & PG_R2
    WS1 & WS2 & WS3 --> Queue
    Queue --> Worker
    Worker --> ClickDB
    Worker --> PG_W
```

---

### Read Path (URL Redirection) — The Critical Path

This handles 35,000 requests/second. Every millisecond matters.

```mermaid
sequenceDiagram
    participant B as Browser
    participant CDN as CDN (CloudFront)
    participant WS as Web Server
    participant R as Redis Cache
    participant DB as PostgreSQL Read Replica
    participant Q as Kafka Queue

    B->>CDN: GET /aB3xK9m
    CDN-->>B: Cache Miss (first request)

    B->>WS: GET /aB3xK9m
    WS->>R: GET url:aB3xK9m

    alt Cache Hit (~99% of requests)
        R-->>WS: {long_url: "https://...", expires_at: null}
        WS->>Q: publish click_event (async, fire-and-forget)
        WS-->>B: 302 Location: https://...
    else Cache Miss (~1% of requests)
        R-->>WS: nil
        WS->>DB: SELECT long_url FROM urls WHERE short_code='aB3xK9m'
        DB-->>WS: row data
        WS->>R: SET url:aB3xK9m {data} EX 3600
        WS->>Q: publish click_event (async)
        WS-->>B: 302 Location: https://...
    end
```

**Latency budget for cache-hit path:**
- Redis lookup: ~1ms
- Response construction: ~0.5ms
- Async Kafka publish: 0ms (non-blocking)
- **Total: ~2ms** — well within our 10ms P99 target

---

### Write Path (URL Creation)

```mermaid
sequenceDiagram
    participant Client
    participant WS as Web Server
    participant R as Redis
    participant DB as PostgreSQL Primary
    participant Safe as SafeBrowsing API

    Client->>WS: POST /v1/urls {long_url}
    WS->>Safe: check URL safety (async)
    Safe-->>WS: safe/unsafe

    alt URL is unsafe
        WS-->>Client: 422 URL_BLOCKED
    else URL is safe
        WS->>WS: generate short_code (Base62)
        WS->>DB: INSERT INTO urls ...
        DB-->>WS: {id, short_code}
        WS->>R: SET url:{short_code} {data} EX 3600
        WS-->>Client: 201 {short_url: "https://..."}
    end
```

---

### Component Breakdown

**CDN (CloudFront):**
- Caches 301 redirects at edge nodes globally
- Reduces latency for repeat visitors from same region
- Only used for anonymous links (301) — analytics links bypass CDN

**Load Balancer (AWS ALB):**
- Round-robin across web server fleet
- Health checks every 10s
- Sticky sessions NOT needed (stateless servers)

**Web Servers (FastAPI / Node.js):**
- Stateless — can scale horizontally to any count
- Connection pooling to Redis (persistent connections)
- Connection pooling to PostgreSQL via PgBouncer (100 DB connections shared across 1000 app connections)

**Redis Cluster:**
- Primary for reads/writes, replicas for read scale-out
- 2GB memory (hot URL cache)
- AOF persistence for durability

**PostgreSQL:**
- Single primary for writes (URL creation, click count flush)
- 2+ read replicas for read queries
- WAL streaming replication, ~100ms replication lag acceptable

**Kafka Queue:**
- Decouples click tracking from the redirect critical path
- Analytics worker consumes and writes to ClickHouse
- Batch flush: click_count updated in PostgreSQL every 60s

---

### Key Design Decisions

**Interviewer:** "Why not just use Redis as the primary store?"

**Candidate:** "Redis is an excellent cache but I wouldn't use it as primary storage for three reasons: (1) Memory is expensive — at 9TB we'd need a massive Redis cluster versus cheap PostgreSQL SSDs. (2) Redis persistence (AOF/RDB) is not as battle-tested for durability as PostgreSQL WAL. (3) Complex queries for analytics are much harder in Redis. I use Redis where it excels — as an ultra-fast cache layer."

**Interviewer:** "What if Redis goes down?"

**Candidate:** "The system degrades gracefully — reads fall through to PostgreSQL read replicas which handle ~1,000 reads/second easily. That's below our average load. We'd see latency increase from 2ms to 10ms, but no outage. We alert on Redis unavailability and auto-restart within seconds via Kubernetes health checks."
""",
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

print(f"Updated {len(CONTENT)} sessions for URL Shortener (part 1)")
