#!/usr/bin/env python3
"""Add content to URL Shortener sessions (topic index 0)."""
import json

CONTENT = {
    "Design: URL Shortener (TinyURL)": {
        1: """## Session 1: Problem Scoping & Requirements

### The Interview Opening

The interviewer says: "Design a URL shortener like TinyURL." Your first 5 minutes are about scoping — never jump to architecture.

**Candidate:** "Before I start designing, I'd like to clarify requirements. Is this a public service like TinyURL, or an internal tool?"

**Interviewer:** "Public service, similar to TinyURL or bit.ly."

**Candidate:** "Got it. Let me confirm functional requirements:
1. Given a long URL, generate a unique short URL
2. Redirecting short URL to the original long URL
3. Custom aliases — should users be able to pick their own short code?
4. Link expiration — do URLs expire?
5. Analytics — do we need click tracking?"

**Interviewer:** "Custom aliases: nice to have. Expiration: yes, default 1 year. Analytics: yes, basic click counts."

### Functional Requirements (Final)

- **Core**: POST a long URL → receive short URL (e.g., `https://sho.rt/abc123`)
- **Core**: GET `/abc123` → HTTP 301/302 redirect to original URL
- **Secondary**: Custom alias support (`POST /shorten` with preferred alias)
- **Secondary**: Expiration timestamps (default: 1 year, configurable up to 5 years)
- **Secondary**: Click analytics (count, referrer, geo, timestamp)

### Non-Functional Requirements

- **Availability**: 99.99% uptime — URL redirection is business-critical
- **Latency**: Redirect p99 < 10ms (users expect near-instant redirects)
- **Consistency**: Short codes must be globally unique — no two URLs can share a code
- **Durability**: Once created, a short URL must never be lost
- **Read-heavy**: Reads (redirects) vastly outnumber writes (URL creation)

### Clarifying the Read/Write Ratio

**Candidate:** "What's the expected scale? DAU and requests per day?"

**Interviewer:** "Let's say 100 million new URLs created per day, 10 billion redirects per day."

This gives a **100:1 read-to-write ratio** — this single fact drives most architectural decisions. You'll optimize the read path aggressively (CDN, cache) and the write path can be simpler.

### What NOT to Design

Be explicit about scope boundaries:
- No user authentication/login system
- No URL preview or safety scanning
- No dashboard UI
- No A/B testing or campaign tracking

### Interview Q&A

**Q: Why 301 vs 302 redirect?**
A: 301 (permanent) — browser caches the redirect, reducing server load but losing analytics for cached hits. 302 (temporary) — browser always hits your server, giving full analytics. TinyURL uses 301 for performance; bit.ly uses 302 for analytics. **Choose based on whether analytics matters more than server load.**

**Q: What happens when a short URL expires?**
A: Return HTTP 410 Gone (not 404). 410 signals the resource existed but is intentionally gone — better for SEO and client error handling than 404 which implies it never existed.

**Q: Should we allow the same long URL to get multiple short codes?**
A: It's simpler to allow duplicates — checking for existing long URLs requires a reverse index and adds write latency. Most systems allow the same long URL to have multiple short codes unless dedup is an explicit requirement.""",

        2: """## Session 2: Capacity Estimation

### The Estimation Framework

Always follow: **Traffic → Storage → Bandwidth → Memory (cache)**. State your assumptions aloud — interviewers care about your reasoning, not just the final number.

### Traffic Estimation

**Write QPS (URL creation):**
- 100 million new URLs/day
- 100,000,000 / 86,400 seconds ≈ **1,157 writes/sec** → round to **~1,200 writes/sec**
- Peak (3x average): **~3,600 writes/sec**

**Read QPS (redirects):**
- 10 billion redirects/day
- 10,000,000,000 / 86,400 ≈ **115,740 reads/sec** → round to **~116,000 reads/sec**
- Peak (3x average): **~350,000 reads/sec**

**Read:Write ratio = 116,000 : 1,200 ≈ 97:1** — confirm your earlier assumption.

### Storage Estimation

**Per URL record size:**
- `id` (8 bytes) + `short_code` (7 bytes) + `long_url` (avg 200 bytes) + `created_at` (8 bytes) + `expires_at` (8 bytes) + `user_id` (8 bytes) = ~**240 bytes/record** → round to **500 bytes** with overhead/indexes

**5-year data volume:**
- 100M URLs/day × 365 days/year × 5 years = **182.5 billion URLs**
- 182.5B × 500 bytes = **91 TB** → this is too large for a single database

**Realistic assumption:** Not all 100M/day are truly unique new services; model as 100M total URLs stored:
- 100M × 500 bytes = **50 GB** — very manageable on a single DB

**Analytics events (separate store):**
- 10 billion redirects/day × 100 bytes/event = **1 TB/day** — needs time-series DB (Cassandra)

### Bandwidth Estimation

**Write bandwidth:**
- 1,200 req/s × 500 bytes request payload = **~600 KB/s** inbound

**Read bandwidth:**
- 116,000 req/s × 100 bytes response (redirect response is tiny) = **~12 MB/s** outbound
- With actual page content served through redirect: user's bandwidth, not our concern

### Memory (Cache) Estimation

Apply the **80/20 rule**: 20% of URLs account for 80% of traffic.
- Daily redirected URLs: 10B reads / 100M unique URLs = ~100 reads per URL average
- Hot URLs (top 20%): 20M URL records × 500 bytes = **10 GB of cache**
- This easily fits in a single Redis node (64 GB RAM typical)

### Derived Architecture Constraints

| Finding | Implication |
|---|---|
| 116K reads/sec at peak | Need multiple read servers + CDN |
| 1,200 writes/sec | Single write master sufficient initially |
| 50 GB URL storage | Single PostgreSQL instance works; shard later |
| 1 TB/day analytics | Cassandra or ClickHouse, not SQL |
| 10 GB hot cache | Single Redis cluster handles it |

### Interview Q&A

**Q: How many servers do we need?**
A: A modern server handles ~50K req/s for simple redirects. At 350K peak reads/sec, we need ~7 read servers. Add 2x headroom → **~15 read servers** behind a load balancer.

**Q: How long can short codes be?**
A: With Base62 (a-z, A-Z, 0-9): 62^6 = 56.8 billion unique codes → enough for 100M/day × 568 days. 7 characters: 62^7 = 3.5 trillion → enough for decades. **Use 7 characters.**

**Q: What if estimation is wrong by 10x?**
A: Good systems are designed for 10x growth without re-architecture. Horizontal scaling of stateless services handles traffic growth; database sharding handles storage growth.""",

        3: """## Session 3: URL Shortening Algorithms

### The Core Problem

Given a long URL, generate a unique 7-character short code. Three main approaches exist — know the trade-offs cold.

### Approach 1: MD5/SHA256 Hashing

1. Compute `MD5(long_url)` → 128-bit hash → 32 hex characters
2. Take first 7 characters as the short code
3. Check if collision exists in DB → if yes, take next 7 characters (e.g., chars 2-8)

**Pros:** Deterministic — same long URL always produces the same short code (natural dedup)

**Cons:**
- MD5 is not designed for uniqueness of short prefixes — collision rate is non-trivial
- Database round-trip required for every write to check collision
- Non-predictable retry logic when all 7-char windows collide
- **Not recommended for production**

### Approach 2: Base62 Encoding of Auto-Increment ID

1. Database auto-increments a global ID (1, 2, 3, ...)
2. Encode the integer to Base62: `encode(12345)` → `"dnh"`
3. Pad to 7 characters: `"0000dnh"`

**Base62 alphabet:** `0-9` (10) + `a-z` (26) + `A-Z` (26) = 62 characters

**Encoding algorithm:**
```
def base62_encode(num):
    chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    result = []
    while num > 0:
        result.append(chars[num % 62])
        num //= 62
    return ''.join(reversed(result)).zfill(7)
```

**Pros:** Zero collisions by construction; simple and fast

**Cons:**
- Global auto-increment is a **single point of failure and bottleneck** at scale
- Sequential IDs are **predictable** — users can enumerate URLs (`abc001`, `abc002`)
- Distributed ID generation needed at scale (Twitter Snowflake, Zookeeper ranges)

### Approach 3: Pre-Generated Short Codes (Recommended)

1. **Key Generation Service (KGS)** pre-generates millions of random 7-char codes offline
2. Stores them in a `keys_unused` table
3. On URL creation request: atomically move one key from `keys_unused` to `keys_used`
4. Return the key as the short code

**Pros:**
- No collision checking at request time (pre-verified offline)
- No sequential IDs — codes are random and non-predictable
- Write service is stateless — can horizontally scale

**Cons:**
- KGS is a new component to maintain
- KGS itself needs HA (run 2 instances, each holding different key ranges in memory)
- Slight complexity: key handoff on KGS failure

### Recommended Architecture: KGS + Base62

```mermaid
graph LR
    WS[Write Service]
    KGS[Key Generation Service]
    KU[(keys_unused table)]
    KA[(keys_used / urls table)]

    KGS -->|batch pre-generate| KU
    WS -->|request key| KGS
    KGS -->|atomic move| KU
    KGS -->|return key| WS
    WS -->|store mapping| KA
```

### Custom Aliases

If user requests custom alias `my-promo`:
1. Check `urls` table: does `short_code = 'my-promo'` exist?
2. If no: insert with that code (bypass KGS)
3. If yes: return HTTP 409 Conflict

Custom aliases don't need to be Base62 — allow alphanumeric + hyphens, max 16 chars.

### Interview Q&A

**Q: Why not UUID as short code?**
A: UUID is 36 characters — too long for a "short" URL. Also has hyphens which are ugly in URLs.

**Q: What about hash collisions with MD5 approach?**
A: MD5 truncated to 7 chars has ~1 collision per 62^7/2 ≈ 1.75 trillion pairs — extremely rare but non-zero, and handling retries adds complexity that KGS avoids entirely.

**Q: How does KGS ensure no two servers get the same key?**
A: KGS uses a DB transaction to atomically SELECT and DELETE from `keys_unused`. Alternatively, each KGS instance can claim a range (e.g., instance A gets IDs 1-1M, instance B gets 1M-2M) using a coordinator.""",

        4: """## Session 4: High-Level Architecture

### Component Overview

The URL Shortener splits into two distinct traffic patterns:
- **Write path**: Infrequent, latency-tolerant (1,200/sec)
- **Read path**: Extremely frequent, latency-critical (116,000/sec)

Design them independently and optimize each.

### Full Architecture Diagram

```mermaid
graph TD
    Client([Client Browser / Mobile App])
    CDN[CDN - CloudFront / Akamai]
    LB[Load Balancer - Layer 7]
    WS[Write Service - URL Creation]
    RS[Read Service - Redirect Service]
    KGS[Key Generation Service]
    Cache[Redis Cache Cluster]
    DB[(Primary DB - PostgreSQL)]
    RDB[(Read Replicas x3)]
    MQ[Message Queue - Kafka]
    AS[Analytics Service]
    ADB[(Analytics DB - Cassandra)]
    KU[(Key Store - MySQL)]

    Client -->|POST /shorten| LB
    Client -->|GET /abc123| CDN
    CDN -->|Cache miss| LB
    LB -->|/shorten| WS
    LB -->|/abc123| RS
    WS -->|request key| KGS
    KGS -->|atomic key| KU
    WS -->|INSERT url record| DB
    WS -->|SET in cache| Cache
    RS -->|GET short_code| Cache
    Cache -->|Miss| RDB
    RDB -->|replicates from| DB
    RS -->|publish click event| MQ
    MQ -->|consume| AS
    AS -->|write analytics| ADB
    CDN -.->|cache redirect 301| Client
```

### Component Deep Dive

**CDN (Edge Layer):**
- Cache 301 redirects at the edge for top URLs
- TTL = URL expiration time (e.g., 1 year)
- Eliminates server hits for the most popular 1% of URLs which handle 50% of traffic
- CloudFront, Akamai, or Fastly

**Load Balancer:**
- Layer 7 (application-aware) — routes `/shorten` to Write Service, all other paths to Read Service
- Health checks every 5s; removes unhealthy instances within 10s
- Connection draining: 30s grace period on instance removal

**Write Service (stateless):**
- Validates long URL (valid URL format, not blocked domain)
- Requests key from KGS
- Inserts `{short_code, long_url, created_at, expires_at}` into Primary DB
- Warm-writes to Redis cache (write-through caching)
- Horizontally scalable — deploy 3-5 instances

**Read Service / Redirect Service (stateless):**
- Receives GET `/abc123`
- Checks Redis cache first (sub-millisecond)
- On cache miss: queries read replica, caches result
- Checks expiration: if expired, returns 410 Gone
- Returns HTTP 302 redirect with `Location: <long_url>` header
- Also publishes `{short_code, timestamp, ip, referrer, user_agent}` to Kafka topic

**Key Generation Service:**
- Two instances for HA (active-active)
- Each loads 10,000 keys from DB into memory at startup
- On request: returns next key from in-memory queue, atomically marks used in DB
- If instance crashes: unused in-memory keys are lost (acceptable — 10K keys wasted out of 3.5 trillion)

**Redis Cache:**
- Cache key: `url:{short_code}` → value: `{long_url, expires_at}`
- TTL: 24 hours (or until URL expiration, whichever shorter)
- Eviction: allkeys-lru
- Cluster mode: 3 primary shards, 3 replicas (6 nodes total)
- Expected hit rate: >95% for popular URLs

**Analytics Pipeline:**
- Kafka buffers click events — decouples Read Service from analytics writes
- Analytics Service consumes events, batches by 1s, writes to Cassandra
- Cassandra schema: partition key = `short_code`, clustering key = `day` → fast per-URL time-series queries

### API Contracts

```
POST /api/v1/shorten
Body: { "long_url": "https://...", "alias": "optional", "expires_in_days": 365 }
Response 201: { "short_url": "https://sho.rt/abc123", "short_code": "abc123", "expires_at": "2027-01-01" }

GET /{short_code}
Response 302: Location: <long_url>
Response 410: { "error": "URL expired" }
Response 404: { "error": "URL not found" }
```

### Interview Q&A

**Q: Why separate Write and Read services?**
A: They have completely different scaling needs. Read service needs 100x more instances. Separating them allows independent scaling, independent deployment, and independent failure domains.

**Q: What if Redis goes down?**
A: Read service falls back to read replicas. Latency increases from <1ms to ~5ms, but the system stays functional. This is acceptable degraded mode.

**Q: Why write to cache on URL creation (write-through) instead of waiting for first read?**
A: Newly created URLs often get shared immediately and receive a burst of traffic. Write-through ensures cache is warm before the traffic spike hits.""",

        5: """## Session 5: Database Design

### Schema Design

The URL Shortener needs two primary tables plus a key store.

**urls table (Primary store):**
```sql
CREATE TABLE urls (
    id            BIGINT PRIMARY KEY DEFAULT nextval('urls_id_seq'),
    short_code    VARCHAR(16) UNIQUE NOT NULL,
    long_url      TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ,
    user_id       BIGINT,
    click_count   BIGINT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_urls_expires_at ON urls(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_urls_user_id ON urls(user_id) WHERE user_id IS NOT NULL;
```

**keys table (KGS pre-generated keys):**
```sql
CREATE TABLE keys_unused (
    key_value VARCHAR(7) PRIMARY KEY
);

CREATE TABLE keys_used (
    key_value    VARCHAR(7) PRIMARY KEY,
    used_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**analytics table (Cassandra):**
```cql
CREATE TABLE click_events (
    short_code  TEXT,
    event_date  DATE,
    event_time  TIMESTAMP,
    ip_address  TEXT,
    country     TEXT,
    referrer    TEXT,
    user_agent  TEXT,
    PRIMARY KEY ((short_code, event_date), event_time)
) WITH CLUSTERING ORDER BY (event_time DESC)
  AND default_time_to_live = 7776000;  -- 90 days
```

### SQL vs NoSQL Decision

| Factor | SQL (PostgreSQL) | NoSQL (DynamoDB/Cassandra) |
|---|---|---|
| URL records | 50GB fits easily | Overkill for this scale |
| Transactions | ACID for key handoff | Not needed |
| Complex queries | User URL listing | Simple key lookups |
| Analytics | Too slow for 1TB/day | Cassandra excels |

**Decision: PostgreSQL for URL records, Cassandra for analytics events.**

PostgreSQL handles the URL store beautifully at this scale. The lookup pattern is always by `short_code` — a point query on an indexed column. With a B-tree index, this is O(log n) — at 100M records, that's about 27 comparisons, which is essentially instant.

### Read Replica Strategy

```mermaid
graph LR
    WS[Write Service] -->|writes| Primary[(Primary DB)]
    Primary -->|async replication| R1[(Replica 1)]
    Primary -->|async replication| R2[(Replica 2)]
    Primary -->|async replication| R3[(Replica 3)]
    RS[Read Service] -->|reads| R1
    RS -->|reads| R2
    RS -->|reads| R3
```

- 3 read replicas handle 116K reads/sec (each handles ~40K/sec)
- Async replication lag: <100ms — acceptable since redirects are read-after-write from cache
- Failover: if primary fails, promote replica with pg_auto_failover or Patroni

### URL Expiration

Two strategies for handling expired URLs:

**Strategy 1: Lazy expiration (recommended)**
- Don't delete expired URLs from DB immediately
- On redirect request: check `expires_at < NOW()` → return 410
- Run background cleanup job nightly: `DELETE FROM urls WHERE expires_at < NOW() - INTERVAL '7 days'`

**Strategy 2: Active TTL**
- Schedule deletion job at expiration time using a task queue
- More immediate cleanup but operationally complex

Lazy expiration is simpler and provides a safety buffer to restore accidentally expired URLs.

### Sharding Strategy (Future Scale)

When the single primary can no longer handle write throughput (>10K writes/sec or >500GB data):

**Shard by short_code prefix:**
- Shard 0: codes starting with `0-9`
- Shard 1: codes starting with `a-m`
- Shard 2: codes starting with `n-z`
- No cross-shard joins needed (all queries are point lookups by short_code)

**Alternative: Consistent hashing**
- Hash `short_code` to determine shard
- Virtual nodes allow rebalancing when adding shards

### Interview Q&A

**Q: Why not store click_count in the urls table?**
A: Hot-URL updates would cause write contention — thousands of concurrent UPDATE on the same row. Use Cassandra for analytics and compute aggregates asynchronously. Update `click_count` via batch job every minute.

**Q: Should we index long_url for deduplication?**
A: Only if dedup is required. A text index on long_url (up to 2KB) is large and adds write overhead. Better to skip dedup (allow multiple short codes per long URL) unless explicitly required.

**Q: How do we handle the keys_unused table at scale?**
A: KGS loads batches of 10,000 keys into memory. DB transaction marks them as "claimed". Even at 1,200 writes/sec, one batch lasts 8+ seconds — very low DB pressure on the key table.""",

        6: """## Session 6: Caching Strategy

### Cache Layer Design

The cache is the most impactful component for the read path. A cache miss costs ~5ms (DB query); a cache hit costs ~0.5ms (Redis). At 116K reads/sec, even a 90% hit rate means 11,600 DB queries/sec — too high. Target 95%+ hit rate.

### Redis Cluster Configuration

```mermaid
graph TD
    RS[Read Service]
    RS -->|hash slot| S0[Shard 0\n0-5460]
    RS -->|hash slot| S1[Shard 1\n5461-10922]
    RS -->|hash slot| S2[Shard 2\n10923-16383]
    S0 --- R0[Replica 0]
    S1 --- R1[Replica 1]
    S2 --- R2[Replica 2]
```

**Redis cluster: 3 primary shards + 3 replicas**
- Each primary handles ~40K reads/sec (Redis handles 100K+ ops/sec single-threaded)
- Replication provides HA — replica promotes automatically if primary fails
- Hash slots distribute keys evenly across shards

### Cache Data Model

```
Key:   url:{short_code}
Value: JSON { "long_url": "https://...", "expires_at": 1735689600, "active": true }
TTL:   min(24h, time_until_expiration)
```

Store expiration in the cached value so the Read Service can return 410 without a DB hit even for cached (but expired) URLs.

### Cache-Aside Pattern (Read Path)

```
1. Read Service receives GET /abc123
2. REDIS GET url:abc123
3. If HIT:
   a. Check expires_at in cached value
   b. If expired: return 410 Gone
   c. If active: return 302 redirect
4. If MISS:
   a. Query read replica: SELECT long_url, expires_at FROM urls WHERE short_code = 'abc123'
   b. If not found: return 404
   c. SET url:abc123 {json} EX {ttl}
   d. Return redirect
```

### Write-Through Pattern (Write Path)

On URL creation, warm the cache immediately:
```
1. Write Service inserts into DB
2. Write Service: REDIS SET url:{new_code} {json} EX 86400
3. Return short URL to client
```

This ensures the first redirect (which often comes seconds after creation) hits cache, not DB.

### Cache Invalidation

When a URL is deactivated or deleted:
```
REDIS DEL url:{short_code}
```

When a URL is updated (rare — custom alias destination change):
```
REDIS SET url:{short_code} {new_json} EX {remaining_ttl}
```

### Hotspot Problem

**Problem:** A celebrity shares a short URL → 1M concurrent requests for the same key → Redis shard handling that hash slot gets overwhelmed.

**Solution 1: Local in-process cache**
- Each Read Service instance caches top 10,000 URL resolutions in-memory (LRU)
- `url:abc123` → resolution cached for 60 seconds locally
- Eliminates Redis calls for hot keys entirely

**Solution 2: Key replication**
- Store hot keys on all 3 shards: `url:abc123:0`, `url:abc123:1`, `url:abc123:2`
- Read Service picks shard randomly for hot keys

**Solution 3: CDN caching (best for extreme hotspots)**
- Configure CDN to cache 302 responses for specific short codes
- Cache-Control: `max-age=3600, public`
- Traffic never reaches origin servers

### Cache Sizing

- Hot URL set: top 20% of 100M URLs = 20M records
- Per record: 500 bytes (URL avg 400B + JSON overhead 100B)
- Total hot cache: 20M × 500B = **10 GB**
- Redis nodes: 3 primaries × 32 GB RAM = 96 GB available → **very comfortable**

### Interview Q&A

**Q: What's the cache eviction policy?**
A: `allkeys-lru` — evict least-recently-used keys when memory is full. This naturally keeps hot URLs in cache. Don't use `volatile-lru` (only evicts keys with TTL) since some URLs have no expiration.

**Q: How do you handle cache stampede on cold start?**
A: Use mutex lock pattern — when a cache miss occurs, first acquire a distributed lock (SETNX) before querying DB. Other processes wait and retry, finding the cache warm on retry. Alternatively, use probabilistic early expiration (PER) to refresh cache before TTL expires.

**Q: What percentage of requests should hit cache in steady state?**
A: 80/20 rule → top 20% of URLs = 80% of traffic → ~80% cache hit. With write-through warming and 24h TTL: expect 90-95% hit rate in steady state.""",

        7: """## Session 7: Scalability Deep Dive

### Scaling the Read Path

At 350,000 reads/sec peak, here is the scaling strategy layer by layer:

**Layer 1: CDN (handles top 1% of URLs)**
- Deploy edge nodes in 50+ PoPs globally
- Cache 301/302 responses at CDN for popular short codes
- Reduces origin traffic by 30-50%
- Response time from edge: <20ms globally vs 200ms+ to origin

**Layer 2: Read Service (stateless horizontal scaling)**
- Auto-scaling group: 15-30 instances during peak
- Each instance: 8 vCPU, handles ~25K req/sec
- Health check: `GET /health` → 200 OK
- Rolling deploy: replace instances one by one with no downtime

**Layer 3: Redis Cache (95%+ hit rate)**
- 3 shards handle remaining 116K reads/sec after CDN
- Each shard: ~40K reads/sec (well within Redis 100K ops/sec limit)

**Layer 4: Read Replicas (5% cache misses)**
- 5,800 cache misses/sec routed to 3 read replicas
- Each replica: ~2,000 DB queries/sec (trivial for PostgreSQL)

### Scaling the Write Path

At 1,200 writes/sec (3,600 peak):

**Single primary PostgreSQL:** handles up to ~5,000 writes/sec for this workload — no sharding needed initially.

When writes exceed capacity:
1. **Connection pooling with PgBouncer:** reduces connection overhead, effectively 2x write throughput
2. **Write-ahead log (WAL) optimization:** increase `checkpoint_completion_target = 0.9`, `wal_buffers = 64MB`
3. **Async writes:** batch inserts (insert 100 URLs per transaction instead of 1)
4. **Horizontal sharding by short_code:** split across 4 DB clusters when needed

### Global Distribution

```mermaid
graph TD
    US[US East Region]
    EU[EU West Region]
    AP[APAC Region]

    US -->|writes route to| Primary[(Global Primary\nUS-East)]
    EU -->|local reads| EU_R[(EU Read Replica)]
    AP -->|local reads| AP_R[(APAC Read Replica)]
    Primary -->|geo-replication| EU_R
    Primary -->|geo-replication| AP_R
```

Writes always go to global primary (strong consistency). Reads use local replicas (<5ms latency) with acceptable eventual consistency lag (<500ms).

### Database Sharding Plan

**When to shard:** Primary DB exceeds 1TB data or 5,000 writes/sec.

**Sharding key: `short_code`**
- Hash first 2 characters → 62 × 62 = 3,844 possible buckets → map to N shards
- Shard 0: codes `00`-`0z`, Shard 1: codes `0A`-`0Z`, etc.

**Routing layer:**
```
shard_id = hash(short_code[:2]) % num_shards
db_connection = shard_pool[shard_id]
```

All URL operations are point lookups by `short_code` — no cross-shard queries ever needed.

### Load Balancer Configuration

```
# Nginx upstream config
upstream read_service {
    least_conn;  # route to server with fewest connections
    server read-1.internal:8080 weight=1;
    server read-2.internal:8080 weight=1;
    server read-3.internal:8080 weight=1;
    keepalive 100;  # persistent connections
}

upstream write_service {
    server write-1.internal:8080;
    server write-2.internal:8080;
    keepalive 20;
}
```

### Failure Modes and Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| Redis primary fails | Cache miss → DB hit, 5x latency | Auto-failover replica → primary in <30s |
| Read replica fails | Remaining replicas handle load | Auto-scaling adds new replica |
| Write primary fails | No new URL creation | pg_auto_failover promotes replica in <60s |
| KGS crashes | No URL creation | Second KGS instance takes over (no shared state) |
| CDN outage | All traffic hits origin | CDN has 99.99% SLA; origin handles load |

### Rate Limiting

Prevent abuse on the write path:
- Per-IP: 100 URL creations/hour
- Per-API-key: 10,000 URL creations/hour (for registered users)
- Global: 2,000 writes/sec circuit breaker

### Interview Q&A

**Q: How do you handle a traffic spike from a viral URL?**
A: Three defenses: (1) CDN caches the redirect at edge — after first few requests, 99% serve from CDN. (2) Local in-process cache on Read Service instances — each instance caches top 10K URLs in-memory. (3) Redis handles remaining traffic. The system degrades gracefully under extreme load.

**Q: When would you switch to a NoSQL store for URLs?**
A: When writes exceed 50K/sec or data exceeds 10TB. DynamoDB with `short_code` as partition key gives effectively unlimited scale at the cost of SQL flexibility and higher cost.""",

        8: """## Session 8: API Design & Edge Cases

### Complete API Specification

**POST /api/v1/shorten — Create short URL**
```
Request:
  POST /api/v1/shorten
  Content-Type: application/json
  Authorization: Bearer {token}  (optional for anonymous)

  {
    "long_url": "https://www.example.com/very/long/path?with=params",
    "custom_alias": "my-promo",        // optional, 3-16 chars
    "expires_in_days": 30,             // optional, default 365
    "title": "My Campaign Link"         // optional, for user dashboard
  }

Response 201 Created:
  {
    "short_url": "https://sho.rt/my-promo",
    "short_code": "my-promo",
    "long_url": "https://www.example.com/...",
    "created_at": "2025-01-01T00:00:00Z",
    "expires_at": "2025-01-31T00:00:00Z"
  }

Response 409 Conflict: (custom alias taken)
  { "error": "alias_taken", "message": "Custom alias 'my-promo' is already in use" }

Response 422 Unprocessable Entity: (invalid URL)
  { "error": "invalid_url", "message": "The provided URL is malformed" }

Response 429 Too Many Requests:
  { "error": "rate_limited", "retry_after": 3600 }
```

**GET /{short_code} — Redirect**
```
Request: GET /abc123

Response 302 Found:
  Location: https://www.example.com/...
  X-Short-Code: abc123
  Cache-Control: no-store  (use no-store to preserve analytics)

Response 410 Gone: (expired)
  { "error": "expired", "expired_at": "2025-01-01T00:00:00Z" }

Response 404 Not Found: (never existed)
  { "error": "not_found" }
```

**GET /api/v1/urls/{short_code}/stats — Analytics**
```
Response 200:
  {
    "short_code": "abc123",
    "total_clicks": 42891,
    "clicks_today": 1203,
    "top_countries": [{"country": "US", "count": 15000}, ...],
    "clicks_by_day": [{"date": "2025-01-01", "count": 500}, ...]
  }
```

**DELETE /api/v1/urls/{short_code} — Deactivate**
```
Response 204 No Content: (success)
Response 403 Forbidden: (not owner)
Response 404 Not Found:
```

### Edge Cases and Handling

**1. Circular redirects**
- Short URL that redirects to another short URL on the same system
- Validation: on `POST /shorten`, check if `long_url` is itself a short URL domain
- If yes: resolve the target and store the final destination

**2. Malicious URLs**
- Validate URL format with regex + URL parsing library
- Block known malware domains using Google Safe Browsing API
- Reject URLs to localhost, private IP ranges (127.x, 192.168.x, 10.x), metadata services (169.254.x)

**3. URL with fragments (#)**
- `https://example.com/page#section` — the `#fragment` is never sent to the server by browsers
- Store exactly as provided; it round-trips correctly through the redirect

**4. Extremely long URLs**
- Max `long_url` length: 2,048 characters (standard URL length limit)
- Return 422 if exceeded

**5. Duplicate long URLs**
- Same long URL creating multiple short codes: **allowed by default**
- If dedup requested: `SELECT short_code FROM urls WHERE long_url = ? AND is_active = true LIMIT 1`
- Return existing short code if found (idempotent behavior)

**6. Concurrent custom alias requests**
- Two requests simultaneously request custom alias "my-promo"
- DB unique constraint on `short_code` ensures exactly one wins
- Loser gets 409 Conflict

**7. Short code case sensitivity**
- `abc123` and `ABC123` are different codes (Base62 is case-sensitive)
- Normalize: do NOT lowercase codes (would halve the keyspace)
- Do normalize the domain in long_url (`HTTP://EXAMPLE.COM` → `http://example.com`)

**8. Vanity URL attacks**
- Users requesting offensive or brand-impersonating custom aliases
- Blocklist: `['admin', 'api', 'health', 'login', 'www', ...]` + profanity filter

### HTTP Status Code Decision Tree

```
GET /{short_code}
├── code exists in DB?
│   ├── No → 404 Not Found
│   └── Yes
│       ├── is_active = false? → 410 Gone
│       ├── expires_at < now? → 410 Gone
│       └── valid → 302 Found (or 301 if analytics not needed)
```

### Interview Q&A

**Q: Should the API be versioned?**
A: Yes, always use versioning (`/api/v1/`). URL shorteners are permanent — changing API contracts breaks integrations. Version prefix lets you deploy `/api/v2/` for breaking changes without disrupting existing clients.

**Q: What response code for the redirect — 301 or 302?**
A: This is a classic interview question. 301 (permanent) — browser caches it, won't hit your server again → no analytics for repeat visits. 302 (temporary) — browser always hits your server → full analytics. Choose 302 unless you explicitly want to offload server traffic and sacrifice analytics.""",

        9: """## Session 9: Analytics Pipeline

### Requirements

- Count clicks per short URL (real-time, within 1 minute)
- Breakdown by: country, referrer, device type, hour of day
- Retention: 90 days of event-level data, 2 years of daily aggregates
- Query patterns: "clicks in last 7 days for short code X", "top URLs by country"

### Pipeline Architecture

```mermaid
graph LR
    RS[Read Service]
    K[Kafka\nclick-events topic\n50 partitions]
    CS[Consumer Service\nflink / spark streaming]
    Cass[(Cassandra\nraw events\n90 day TTL)]
    CH[(ClickHouse\naggregates)]
    Redis2[Redis\nreal-time counters]
    API[Analytics API]

    RS -->|async publish| K
    K -->|consume| CS
    CS -->|write raw| Cass
    CS -->|aggregate| CH
    CS -->|INCR counter| Redis2
    API -->|query| CH
    API -->|GET counter| Redis2
```

### Kafka Configuration

**Topic: `click-events`**
- 50 partitions — allows 50 parallel consumers
- Partition key: `short_code` — all events for same code go to same partition (enables ordered processing per code)
- Retention: 7 days (replay capability for consumer failures)
- Replication factor: 3 (survives 2 broker failures)

**Event schema:**
```json
{
  "short_code": "abc123",
  "timestamp": 1735689600,
  "ip_hash": "sha256(ip + salt)",
  "country": "US",
  "referrer": "https://twitter.com",
  "user_agent": "Mozilla/5.0...",
  "device_type": "mobile"
}
```

Note: hash the IP immediately in the Read Service — never store raw IPs (GDPR compliance).

### Cassandra Schema (Raw Events)

```cql
CREATE TABLE click_events (
    short_code   TEXT,
    event_date   DATE,
    event_time   TIMEUUID,
    country      TEXT,
    referrer     TEXT,
    device_type  TEXT,
    PRIMARY KEY ((short_code, event_date), event_time)
) WITH CLUSTERING ORDER BY (event_time DESC)
  AND default_time_to_live = 7776000;  -- 90 days
```

Query: "All clicks for abc123 on 2025-01-15"
```cql
SELECT * FROM click_events
WHERE short_code = 'abc123' AND event_date = '2025-01-15';
```

### Real-Time Counters (Redis)

For real-time click counts without querying Cassandra:

```
INCR clicks:total:{short_code}              # total all-time
INCR clicks:daily:{short_code}:{YYYYMMDD}   # daily count
EXPIRE clicks:daily:{short_code}:{YYYYMMDD} 172800  # 48h TTL
```

Consumer Service increments these atomically after writing to Cassandra.
Analytics API reads from Redis for "current count" queries → sub-millisecond response.

### ClickHouse Aggregates (Long-Term Analytics)

```sql
CREATE TABLE click_aggregates (
    short_code   String,
    event_date   Date,
    country      LowCardinality(String),
    device_type  LowCardinality(String),
    click_count  UInt64
)
ENGINE = SummingMergeTree(click_count)
PARTITION BY toYYYYMM(event_date)
ORDER BY (short_code, event_date, country, device_type);
```

Consumer Service inserts into ClickHouse in batches of 10,000 events every 10 seconds.
ClickHouse merges duplicates using SummingMergeTree — extremely efficient for this pattern.

### Handling Analytics Failures

**Kafka producer failure in Read Service:**
- Use async fire-and-forget (`acks=0`) — prefer low latency redirect over analytics guarantee
- Lost events: acceptable (analytics is approximate, not billing-grade)

**Consumer Service lag:**
- Monitor consumer group lag: alert if >100,000 events behind
- Auto-scale consumers (up to 50, matching partition count)

**Cassandra write failure:**
- Retry with exponential backoff (3 retries, 100ms/500ms/2000ms)
- Dead letter queue: failed events → Kafka DLQ topic for manual replay

### Aggregation Job (Batch Fallback)

Nightly Spark job reconciles ClickHouse against Cassandra raw events:
- Recomputes daily aggregates for previous day
- Corrects for any streaming errors
- Runs at 2 AM with minimal impact

### Interview Q&A

**Q: Why Kafka instead of writing directly to Cassandra from Read Service?**
A: Decoupling and reliability. If Cassandra is slow (write latency spike to 100ms), without Kafka, every redirect waits 100ms. With Kafka, Read Service publishes in <1ms (async) and the consumer handles backpressure. Kafka also enables replay, multiple consumers, and reprocessing.

**Q: How do you count unique visitors vs total clicks?**
A: Exact unique counting requires storing all visitor identifiers — expensive at scale. Use HyperLogLog (Redis `PFADD`/`PFCOUNT`) for approximate unique counting with 0.81% error. Exact unique counts require offline bloom filter processing against Cassandra.

**Q: How do you handle GDPR for analytics?**
A: Hash IPs before storage. Store no PII in analytics pipeline. Implement right-to-erasure: since IP is hashed and hash is non-reversible, GDPR deletion of user data doesn't require analytics deletion.""",

        10: """## Session 10: Mock Interview

### Full Interview Simulation (45 minutes)

**Interviewer:** "Design TinyURL. You have 45 minutes."

---

**[Minutes 0-5: Requirements]**

**Candidate:** "Before designing, let me clarify scope. Is this a public service or internal?"

**Interviewer:** "Public, similar to bit.ly."

**Candidate:** "Core features: shorten URL, redirect short to long. Should I include custom aliases, expiration, analytics?"

**Interviewer:** "Yes to all three."

**Candidate:** "Scale: how many URLs created per day, and how many redirects?"

**Interviewer:** "100 million new URLs per day, 10 billion redirects per day."

**Candidate:** "Got it. That's 100:1 read-to-write ratio — I'll optimize the read path heavily. Non-functional: high availability 99.99%, redirect latency p99 under 10ms, globally unique short codes. Anything out of scope: user auth, URL preview, safety scanning."

---

**[Minutes 5-10: Capacity Estimation]**

**Candidate:** "Writes: 100M / 86,400 = ~1,200/sec. Reads: 10B / 86,400 = ~116,000/sec. At peak 3x: 350,000 reads/sec.

Storage: each URL ~500 bytes. 100M URLs = 50GB — fits in single PostgreSQL instance easily. Analytics: 10B events/day × 100B = 1TB/day — needs Cassandra.

Cache: top 20% of URLs = 20M records × 500B = 10GB — fits in Redis.

Short code length: Base62, 7 chars = 62^7 = 3.5 trillion unique codes. Enough for centuries."

---

**[Minutes 10-20: High-Level Architecture]**

**Candidate:** "I'll separate read and write paths. For reads: Client → CDN → Load Balancer → Read Service (15 instances) → Redis Cache → Read Replicas.

For writes: Client → LB → Write Service → Key Generation Service → PostgreSQL Primary. Write Service also publishes click events to Kafka → Analytics Consumer → Cassandra.

The CDN handles top 1% of URLs which drive 50% of traffic. Redis at 95%+ hit rate handles the rest. DB only sees the 5% cache misses."

**Interviewer:** "Why separate Read and Write services?"

**Candidate:** "Different scaling needs. I need 15-30 Read Service instances but only 3-5 Write Service instances. Separating them lets me scale independently and isolate failures. A bug in the write path can't crash the redirect path."

---

**[Minutes 20-30: Deep Dive — Shortening Algorithm]**

**Interviewer:** "How do you generate short codes?"

**Candidate:** "Three approaches: MD5 hash prefix, Base62 of auto-increment ID, or pre-generated keys via a Key Generation Service. I recommend KGS.

KGS pre-generates millions of random 7-char Base62 codes, stores them in `keys_unused` table. On URL creation: atomically claim one key, mark it used, return to Write Service. Zero collision checking at request time. Two KGS instances for HA — if one crashes, the other takes over. Lost in-memory keys are acceptable waste out of 3.5 trillion total."

**Interviewer:** "What if both KGS instances give out the same key simultaneously?"

**Candidate:** "DB unique constraint on `short_code` prevents it. KGS claims keys via `SELECT ... FOR UPDATE` or equivalent atomic operation. Two instances can't claim the same key. Also, each instance loads a separate batch — they never draw from the same pool simultaneously."

---

**[Minutes 30-38: Failure Modes]**

**Interviewer:** "What happens when Redis goes down?"

**Candidate:** "Read Service detects Redis unavailability (connection timeout <1s). Falls back to read replicas. Latency increases from 0.5ms to 5ms — noticeable but not fatal. All services continue functioning. Redis auto-failover promotes a replica to primary within 30 seconds."

**Interviewer:** "What about a viral URL — 10 million requests in 1 minute for the same short code?"

**Candidate:** "Three defenses layer up: First, CDN caches that redirect at edge after the first few hits — the vast majority serve from CDN. Second, each Read Service instance has a local in-memory LRU cache for top 10K codes — eliminates Redis round-trips entirely for hot keys. Third, Redis still handles overflow. The key insight is that the hottest URLs are cached closest to the user at the CDN edge."

---

**[Minutes 38-45: Wrap-up and Trade-offs]**

**Interviewer:** "What would you design differently for 10x scale?"

**Candidate:** "At 10x: 1.2M writes/sec and 1.16M reads/sec. Reads: CDN and local caches scale naturally. Redis would need more shards — 10 primaries. Reads service: 150+ instances behind ALB. Writes: Single PostgreSQL primary can't handle 12K writes/sec. I'd shard by short_code prefix into 16 PostgreSQL clusters, each handling ~750 writes/sec. KGS needs to be cluster-aware — assign key ranges to shards. Analytics: Kafka partitions scale to 500, Cassandra cluster grows to 30 nodes."

**Interviewer:** "Any concerns with your current design?"

**Candidate:** "Two main ones: First, KGS is a stateful component — if both instances fail simultaneously, URL creation stops until recovery. Mitigation: Write Service can fall back to MD5-based generation as emergency backup. Second, async replication to read replicas means a user who creates a URL and immediately tries to redirect may hit a replica that hasn't replicated yet. Mitigation: Write-through cache ensures the cache is warm, so the redirect hits cache (not the stale replica) on the first request."

---

### Scoring Rubric

| Category | Indicators of Strong Performance |
|---|---|
| Requirements | Asks 5+ clarifying questions, identifies read-heavy nature |
| Estimation | Derives QPS from daily numbers, sizes cache from 80/20 rule |
| Architecture | Separates read/write paths, includes CDN and cache layers |
| Database | Justifies SQL for URLs, Cassandra for analytics |
| Deep Dive | Explains KGS collision avoidance with DB constraint |
| Failure Modes | Covers Redis failover, viral URL hotspot, replica lag |
| Trade-offs | Acknowledges 301 vs 302, async analytics loss |"""
    }
}

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json') as f:
    data = json.load(f)

topic = data[0]
topic_name = topic['topic'].split(' (')[0]  # "Design: URL Shortener"

if topic_name not in CONTENT:
    # Try partial match
    for k in CONTENT:
        if k in topic['topic'] or topic['topic'] in k:
            topic_name = k
            break

sessions = topic['plan']['sessions']
updated = 0
for s in sessions:
    session_num = s['session']
    if session_num in CONTENT[list(CONTENT.keys())[0]]:
        s['content'] = CONTENT[list(CONTENT.keys())[0]][session_num]
        updated += 1
        print(f"  Added content to session {session_num}: {s['title']}")

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

print(f"\nDone. Updated {updated} sessions for {topic['topic']}")
