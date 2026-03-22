#!/usr/bin/env python3
"""Part 2: URL Shortener sessions 6-10"""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if "URL Shortener" in d["topic"])
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
6: """## Session 6: Deep Dive — Short Code Generation

The core algorithm of a URL shortener is generating short, unique codes. There are three main approaches, each with significant trade-offs. This is a favorite deep-dive topic for Google interviewers.

### Approach 1: Random Base62 Generation

The simplest approach: generate random bytes, encode in Base62.

```python
import secrets
import string

BASE62_CHARS = string.ascii_letters + string.digits  # a-zA-Z0-9

def generate_short_code(length: int = 7) -> str:
    \"\"\"Generate a cryptographically random Base62 short code.\"\"\"
    return ''.join(secrets.choice(BASE62_CHARS) for _ in range(length))

# Example outputs:
# "aB3xK9m", "Qr7pL2n", "mN4vW8k"
```

**Problem:** Collisions. Two concurrent requests might generate the same code.

**Solution:** Check-then-insert with retry:

```python
async def create_short_code_random(long_url: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        code = generate_short_code()
        try:
            await db.execute(
                "INSERT INTO urls (short_code, long_url) VALUES ($1, $2)",
                code, long_url
            )
            return code
        except UniqueViolationError:
            # Collision — retry with new code
            if attempt == max_retries - 1:
                raise RuntimeError("Failed to generate unique code after retries")
            continue
```

**Collision probability with 7-char Base62:**
```
P(collision after k insertions) ≈ k² / (2 * 62^7)
At 10M links: (10M)² / (2 * 3.52T) = 0.014 — 1.4% chance of any collision ever
Per-request collision chance: k / 62^7 ≈ negligible
```

This is fine in practice. The retry loop handles the rare collision.

---

### Approach 2: MD5/SHA-256 Hash of Long URL

Hash the long URL and take the first 7 characters.

```python
import hashlib
import base64

def hash_url(long_url: str) -> str:
    \"\"\"Generate short code from URL hash.\"\"\"
    hash_bytes = hashlib.md5(long_url.encode()).digest()
    # Base64url encode (URL-safe), take first 7 chars
    encoded = base64.urlsafe_b64encode(hash_bytes).decode()
    return encoded[:7]

# Same URL always produces same hash
# "https://example.com/page" -> "dBjftJ" (deterministic)
```

**Advantage:** Idempotent — same URL always gets same short code (deduplication).

**Problem 1:** Two different URLs can get the same 7-char prefix (hash collision).

**Problem 2:** If two users both shorten the same URL, do they get the same short link? That leaks information.

**Problem 3:** Sequential users can enumerate URLs by trying common inputs.

**Fix for hash collision:**

```python
def hash_url_with_salt(long_url: str, salt: str = "") -> str:
    input_str = long_url + salt
    hash_bytes = hashlib.sha256(input_str.encode()).digest()
    encoded = base64.urlsafe_b64encode(hash_bytes).decode()
    return encoded[:7].replace('=', 'A')  # remove padding chars

async def create_short_code_hash(long_url: str) -> str:
    code = hash_url_with_salt(long_url)
    while await db.exists("SELECT 1 FROM urls WHERE short_code = $1", code):
        # Hash collision — add incrementing salt
        code = hash_url_with_salt(long_url, salt=code)
    return code
```

---

### Approach 3: Auto-Increment ID + Base62 Encode (Recommended)

Use the database's auto-increment primary key, convert to Base62.

```python
BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode_base62(num: int) -> str:
    \"\"\"Convert integer to Base62 string.\"\"\"
    if num == 0:
        return BASE62[0]
    result = []
    while num > 0:
        result.append(BASE62[num % 62])
        num //= 62
    return ''.join(reversed(result))

def decode_base62(code: str) -> int:
    \"\"\"Convert Base62 string back to integer.\"\"\"
    num = 0
    for char in code:
        num = num * 62 + BASE62.index(char)
    return num

# Examples:
# encode_base62(1)         -> "1"
# encode_base62(62)        -> "10"
# encode_base62(1_000_000) -> "4c92"
# encode_base62(3_521_614_606_208) -> "zzzzzzzz" (max 7-char value)
```

**Full flow:**

```python
async def create_url_with_id_encoding(long_url: str) -> str:
    # Insert with placeholder, get auto-generated ID
    row = await db.fetchrow(
        \"\"\"INSERT INTO urls (short_code, long_url)
           VALUES ('placeholder', $1)
           RETURNING id\"\"\",
        long_url
    )
    db_id = row['id']
    short_code = encode_base62(db_id)

    # Update with real short code
    await db.execute(
        "UPDATE urls SET short_code = $1 WHERE id = $2",
        short_code, db_id
    )
    return short_code
```

**Advantages:**
- Guaranteed unique (IDs are unique)
- No collision checks needed
- Predictable code length growth (short codes start short, grow as IDs grow)

**Disadvantage:**
- Sequential IDs are guessable (`aB3xK9m` then `aB3xK9n`)
- Reveals scale (ID 1,000,000 -> you know there are 1M links)

**Fix for guessability:** XOR the ID with a secret mask before encoding:

```python
MASK = 0x5A4F3C2B  # secret constant, non-zero

def obfuscate_id(db_id: int) -> str:
    return encode_base62(db_id ^ MASK)
```

---

### Approach 4: Distributed ID Generator (Twitter Snowflake)

For multi-datacenter deployments, use a Snowflake-style ID:

```
Snowflake ID (64-bit):
[1 bit sign] [41 bits timestamp ms] [10 bits worker ID] [12 bits sequence]

- Timestamp: ms since epoch (gives ~69 years)
- Worker ID: unique per server (1024 workers max)
- Sequence: 4096 IDs per ms per worker = 4M IDs/sec per worker
```

```python
import time
import threading

class SnowflakeGenerator:
    EPOCH = 1704067200000  # 2024-01-01 00:00:00 UTC in ms
    WORKER_ID_BITS = 10
    SEQUENCE_BITS = 12
    MAX_SEQUENCE = (1 << SEQUENCE_BITS) - 1  # 4095

    def __init__(self, worker_id: int):
        self.worker_id = worker_id
        self.sequence = 0
        self.last_timestamp = -1
        self._lock = threading.Lock()

    def next_id(self) -> int:
        with self._lock:
            ts = int(time.time() * 1000) - self.EPOCH
            if ts == self.last_timestamp:
                self.sequence = (self.sequence + 1) & self.MAX_SEQUENCE
                if self.sequence == 0:
                    # Sequence exhausted — wait for next millisecond
                    while ts <= self.last_timestamp:
                        ts = int(time.time() * 1000) - self.EPOCH
            else:
                self.sequence = 0
            self.last_timestamp = ts
            return (ts << 22) | (self.worker_id << 12) | self.sequence
```

**Interview tip:** Mention Snowflake IDs when asked about distributed systems. It shows you understand the challenges of global uniqueness without a central coordinator.

---

### Recommendation Matrix

| Approach | Uniqueness | Guessable? | Deduplication | Distributed? | Use When |
|---|---|---|---|---|---|
| Random Base62 | High (retry) | No | No | Yes | Simple systems |
| URL Hash | Medium | No | Yes | Yes | Dedup needed |
| ID + Base62 | Guaranteed | Somewhat | No | No (single DB) | Single region |
| Snowflake | Guaranteed | No | No | Yes | Multi-region |

**My recommendation for this interview:** Use random Base62 with retry for simplicity. Mention Snowflake as the production-grade solution for scale.
""",

7: """## Session 7: Deep Dive — Caching & Scaling

With 35,000 reads/second, caching is not optional — it's the entire architecture. Let's go deep on cache design.

### Cache Strategy: Cache-Aside (Lazy Loading)

The most common pattern for URL shorteners:

```python
class URLCache:
    def __init__(self, redis_client, db):
        self.redis = redis_client
        self.db = db
        self.TTL = 3600  # 1 hour

    async def get_url(self, short_code: str) -> dict | None:
        # 1. Check cache
        cache_key = f"url:{short_code}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # 2. Cache miss — query DB
        row = await self.db.fetchrow(
            "SELECT long_url, expires_at, is_active FROM urls WHERE short_code = $1",
            short_code
        )
        if not row:
            # Cache negative result too (prevents DB hammering for invalid codes)
            await self.redis.setex(f"url:404:{short_code}", 300, "1")
            return None

        result = dict(row)
        # 3. Populate cache
        await self.redis.setex(cache_key, self.TTL, json.dumps(result))
        return result

    async def invalidate(self, short_code: str):
        \"\"\"Called when URL is updated or deleted.\"\"\"
        await self.redis.delete(f"url:{short_code}")
```

---

### Cache Stampede Prevention

When Redis restarts or a cache key expires, thousands of requests hit the DB simultaneously. This is the "thundering herd" problem.

**Solution: Probabilistic Early Expiration (PER)**

```python
import math
import random

async def get_url_with_per(self, short_code: str) -> dict | None:
    cache_key = f"url:{short_code}"

    # Get value AND remaining TTL
    pipe = self.redis.pipeline()
    pipe.get(cache_key)
    pipe.ttl(cache_key)
    cached, remaining_ttl = await pipe.execute()

    if cached:
        # PER: if close to expiry and random chance hits, pre-refresh
        # beta controls aggressiveness (1.0 = standard)
        beta = 1.0
        current_time = time.time()
        if remaining_ttl < self.TTL * 0.1:  # Within 10% of expiry
            # Probabilistically refresh early
            if random.random() < beta * (-math.log(random.random())) / remaining_ttl:
                await self._refresh_cache(short_code, cache_key)
        return json.loads(cached)

    return await self._refresh_cache(short_code, cache_key)
```

**Simpler alternative: Mutex lock**

```python
async def get_url_with_lock(self, short_code: str) -> dict | None:
    cache_key = f"url:{short_code}"
    lock_key = f"lock:{short_code}"

    cached = await self.redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # Try to acquire lock
    acquired = await self.redis.set(lock_key, "1", nx=True, ex=5)
    if acquired:
        try:
            result = await self._load_from_db(short_code)
            if result:
                await self.redis.setex(cache_key, self.TTL, json.dumps(result))
            return result
        finally:
            await self.redis.delete(lock_key)
    else:
        # Another process is loading — wait briefly and retry
        await asyncio.sleep(0.1)
        cached = await self.redis.get(cache_key)
        return json.loads(cached) if cached else None
```

---

### Click Count: The Write-Heavy Challenge

35,000 reads/second, but also recording 35,000 click events/second. We cannot do 35,000 DB writes/second on a single PostgreSQL instance.

**Solution: Redis counter + batch flush**

```python
class ClickTracker:
    def __init__(self, redis_client, db):
        self.redis = redis_client
        self.db = db
        self.FLUSH_INTERVAL = 60  # seconds
        self.FLUSH_THRESHOLD = 1000  # flush if count > 1000

    async def record_click(self, short_code: str, metadata: dict):
        pipe = self.redis.pipeline()
        # Atomic increment
        pipe.incr(f"clicks:{short_code}")
        # Store detailed event in stream
        pipe.xadd(f"click_stream", {
            "short_code": short_code,
            "country": metadata.get("country", ""),
            "referrer": metadata.get("referrer", ""),
            "ts": str(int(time.time())),
        })
        await pipe.execute()

    async def flush_to_db(self):
        \"\"\"Called by background job every 60 seconds.\"\"\"
        # Scan all click counter keys
        keys = await self.redis.keys("clicks:*")
        if not keys:
            return

        pipe = self.redis.pipeline()
        for key in keys:
            pipe.getset(key, 0)  # Atomically get and reset to 0
        counts = await pipe.execute()

        # Batch update PostgreSQL
        updates = [
            (int(count), key.replace("clicks:", ""))
            for key, count in zip(keys, counts)
            if int(count) > 0
        ]
        if updates:
            await self.db.executemany(
                "UPDATE urls SET click_count = click_count + $1 WHERE short_code = $2",
                updates
            )
```

---

### TypeScript Implementation

```typescript
// Cache service in TypeScript
import { createClient } from 'redis'

const redis = createClient({ url: process.env.REDIS_URL })

interface URLRecord {
  longUrl: string
  expiresAt: string | null
  isActive: boolean
}

export async function getCachedURL(shortCode: string): Promise<URLRecord | null> {
  const cacheKey = `url:${shortCode}`

  // Check 404 cache first
  const is404 = await redis.get(`url:404:${shortCode}`)
  if (is404) return null

  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached) as URLRecord
  }

  // Cache miss — load from DB
  const row = await db.query(
    'SELECT long_url, expires_at, is_active FROM urls WHERE short_code = $1',
    [shortCode]
  )

  if (!row.rows[0]) {
    // Cache negative result for 5 minutes
    await redis.setEx(`url:404:${shortCode}`, 300, '1')
    return null
  }

  const record: URLRecord = {
    longUrl: row.rows[0].long_url,
    expiresAt: row.rows[0].expires_at,
    isActive: row.rows[0].is_active,
  }

  await redis.setEx(cacheKey, 3600, JSON.stringify(record))
  return record
}
```

---

### Horizontal Scaling

**Web servers:** Add instances freely — they're stateless.

```
# Kubernetes HPA config (horizontal pod autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Redis Cluster** for cache scale-out:

```
Redis Cluster (6 nodes):
  3 masters + 3 replicas
  Each master handles 1/3 of keyspace (hash slots)
  Automatic failover: replica promoted in <30s
  Add nodes: re-shard online (no downtime)
```

**PostgreSQL read replicas:**

```python
class DBPool:
    def __init__(self):
        self.write_pool = asyncpg.create_pool(WRITE_DB_URL)
        self.read_pools = [
            asyncpg.create_pool(url)
            for url in READ_REPLICA_URLS
        ]
        self._rr_idx = 0

    async def execute_read(self, query: str, *args):
        # Round-robin across read replicas
        pool = self.read_pools[self._rr_idx % len(self.read_pools)]
        self._rr_idx += 1
        return await pool.fetchrow(query, *args)

    async def execute_write(self, query: str, *args):
        return await self.write_pool.fetchrow(query, *args)
```
""",

8: """## Session 8: Scaling & Bottlenecks

The interview often ends with: "How would you handle 10x or 100x growth?" This is where you demonstrate you think beyond the happy path.

### Current System Limits

Let's identify what breaks first under load:

```
Current capacity:
  Web servers: 10 instances × 5,000 req/s = 50,000 req/s ✓
  Redis: single node, ~100K ops/s ✓
  PostgreSQL: 1 primary + 2 replicas, ~5,000 reads/s ✓
  Kafka: handles millions of msgs/s ✓

At 10x load (350,000 reads/s):
  Web servers: need 70+ instances — fine (stateless, Kubernetes)
  Redis: single node maxed out — PROBLEM
  PostgreSQL reads: 3,500 to DB after cache — fine
  PostgreSQL writes: 3,500 writes/s — approaching limits

At 100x load (3.5M reads/s):
  Everything needs rethinking
```

---

### Bottleneck 1: Redis Single Node

**Problem:** At 350K ops/s, a single Redis node (100-200K ops/s max) is saturated.

**Solution: Redis Cluster**

```mermaid
graph TD
    subgraph "Redis Cluster (6 nodes)"
        M1[Master 1<br/>Slots 0-5460]
        M2[Master 2<br/>Slots 5461-10922]
        M3[Master 3<br/>Slots 10923-16383]
        R1[Replica 1]
        R2[Replica 2]
        R3[Replica 3]
        M1 --- R1
        M2 --- R2
        M3 --- R3
    end

    App1[Web Server 1] --> M1 & M2 & M3
    App2[Web Server 2] --> M1 & M2 & M3
```

**Key routing:** `CLUSTER KEYSLOT url:aB3xK9m` → slot 7829 → Master 2

Each master handles 1/3 of traffic. Linear scaling by adding shards.

---

### Bottleneck 2: Database Write Contention

**Problem:** Click count updates cause row-level locks on hot URLs.

```sql
-- This causes contention on popular URLs:
UPDATE urls SET click_count = click_count + 1 WHERE short_code = 'viral_link';
-- Thousands of these per second = lock queue buildup
```

**Solution 1: Redis atomic counters (already covered in Session 7)**

**Solution 2: Counter table with partitioned writes**

```sql
-- Instead of updating one row, insert into a counter shard table
CREATE TABLE click_shards (
    short_code  VARCHAR(10) NOT NULL,
    shard_id    SMALLINT    NOT NULL,  -- 0-9
    count       BIGINT      NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (short_code, shard_id)
);

-- Writes go to random shard (no contention between shards)
INSERT INTO click_shards (short_code, shard_id, count)
VALUES ($1, $2, 1)
ON CONFLICT (short_code, shard_id)
DO UPDATE SET count = click_shards.count + 1;

-- Reads sum all shards
SELECT SUM(count) as total_clicks
FROM click_shards
WHERE short_code = $1;
```

Write contention reduced 10x (10 shards = 10x less lock time per row).

---

### Bottleneck 3: Database Sharding (100x growth)

At 100x, even with replicas, writes exceed single PostgreSQL primary capacity.

**Sharding strategy: Shard by short_code**

```python
NUM_SHARDS = 16

def get_shard(short_code: str) -> int:
    \"\"\"Consistent hashing to determine which DB shard.\"\"\"
    return int(hashlib.md5(short_code.encode()).hexdigest(), 16) % NUM_SHARDS

class ShardedDB:
    def __init__(self, shard_pools: list):
        self.shards = shard_pools  # 16 PostgreSQL clusters

    async def get_url(self, short_code: str) -> dict:
        shard = get_shard(short_code)
        return await self.shards[shard].fetchrow(
            "SELECT long_url FROM urls WHERE short_code = $1",
            short_code
        )

    async def create_url(self, short_code: str, long_url: str):
        shard = get_shard(short_code)
        await self.shards[shard].execute(
            "INSERT INTO urls (short_code, long_url) VALUES ($1, $2)",
            short_code, long_url
        )
```

**Interview:** "Wouldn't sharding make re-sharding painful later?"

**Candidate:** "Yes, re-sharding is a known pain point. I'd mitigate it with consistent hashing (virtual nodes) from day one, and use a config service that maps short_code ranges to physical shards — changes to the config file, not application code. Alternatively, Vitess (YouTube's MySQL sharding layer) handles this transparently."

---

### Bottleneck 4: Global Latency

**Problem:** Users in Asia hit US servers — 200ms added latency.

**Solution: Multi-region active-active deployment**

```mermaid
graph TD
    subgraph US_East ["US-East (Primary)"]
        US_APP[App Servers]
        US_DB[PostgreSQL Primary]
        US_REDIS[Redis]
    end

    subgraph EU_West ["EU-West (Secondary)"]
        EU_APP[App Servers]
        EU_DB[PostgreSQL Replica]
        EU_REDIS[Redis]
    end

    subgraph AP_South ["AP-South (Secondary)"]
        AP_APP[App Servers]
        AP_DB[PostgreSQL Replica]
        AP_REDIS[Redis]
    end

    DNS[GeoDNS<br/>Route 53] --> US_APP & EU_APP & AP_APP
    US_DB --> |WAL Streaming| EU_DB & AP_DB
```

- Reads served from nearest region (< 50ms globally)
- Writes go to US-East primary (tolerate ~100ms extra latency for writes)
- GeoDNS routes users to nearest region

---

### Capacity Planning Summary

| Scale | Architecture |
|---|---|
| 0-35K reads/s | Single Redis, 1 PostgreSQL primary + 2 replicas |
| 35K-350K reads/s | Redis Cluster (6 nodes), 5 read replicas |
| 350K-3.5M reads/s | Redis Cluster (30+ nodes), DB sharding (16 shards), CDN aggressive caching |
| 3.5M+ reads/s | Multi-region, custom CDN edge logic, in-memory edge nodes |

**Interviewer:** "When would you shard?"

**Candidate:** "I'd shard when write throughput exceeds what a single PostgreSQL primary can handle — typically around 10,000-15,000 writes/second, or when dataset size exceeds a single machine. Before sharding, I'd try: read replicas, connection pooling, write batching, and vertical scaling. Sharding adds enormous operational complexity."
""",

9: """## Session 9: Edge Cases & Failure Modes

Interviewers at Google and Meta specifically probe edge cases. Candidates who handle only the happy path fail. This session covers what can go wrong and how to design for it.

### Edge Case 1: Duplicate URL Shortening

**Problem:** User shortens `https://example.com` twice. Should they get the same short code?

**Two valid approaches:**

**Approach A: Always create new (simpler)**
```python
# Every POST /v1/urls creates a new record, even for identical URLs
# Simple, no deduplication logic needed
# User gets: tinyurl.com/aB3xK9m AND tinyurl.com/Qr7pL2n for same URL
```

**Approach B: Deduplicate (better UX)**
```python
async def create_or_get_url(long_url: str, user_id: int) -> URLRecord:
    # Check if this user already shortened this URL
    existing = await db.fetchrow(
        \"\"\"SELECT short_code FROM urls
           WHERE long_url = $1 AND user_id = $2 AND is_active = TRUE\"\"\",
        long_url, user_id
    )
    if existing:
        return existing['short_code']  # Return existing short code

    # Create new
    return await create_new_url(long_url, user_id)
```

**Interview answer:** "I'd deduplicate per user — if the same user shortens the same URL, return the existing short code. But different users get different short codes for the same long URL, preserving click tracking per user."

---

### Edge Case 2: Malicious URLs

**Problem:** Users shorten phishing, malware, or CSAM URLs.

```python
class URLSafetyChecker:
    async def is_safe(self, url: str) -> tuple[bool, str]:
        # 1. Check against Google Safe Browsing API
        safe_browsing_result = await self.check_safe_browsing(url)
        if not safe_browsing_result.safe:
            return False, f"MALICIOUS: {safe_browsing_result.threat_type}"

        # 2. Check against internal blocklist (competitor URLs, etc.)
        domain = extract_domain(url)
        if domain in self.blocklist:
            return False, "BLOCKED_DOMAIN"

        # 3. Check URL structure
        if self.has_suspicious_patterns(url):
            return False, "SUSPICIOUS_PATTERN"

        return True, "OK"

    def has_suspicious_patterns(self, url: str) -> bool:
        patterns = [
            r'data:',           # data: URLs
            r'javascript:',     # XSS via redirect
            r'localhost',       # SSRF attack
            r'169\\.254\\.',   # AWS metadata IP (SSRF)
            r'10\\.\\d+\\.',   # Private IP range
        ]
        return any(re.search(p, url, re.I) for p in patterns)
```

---

### Edge Case 3: Link Expiration

**Problem:** Expired links should return 410 Gone, not 404 Not Found.

```python
async def resolve_url(short_code: str) -> tuple[str | None, int]:
    record = await get_cached_url(short_code)

    if not record:
        return None, 404

    if record.get('expires_at'):
        expires = datetime.fromisoformat(record['expires_at'])
        if expires < datetime.utcnow():
            return None, 410  # 410 Gone — explicitly expired

    if not record['is_active']:
        return None, 410  # Manually deactivated

    return record['long_url'], 302
```

**HTTP semantics matter:**
- `404 Not Found`: short code never existed
- `410 Gone`: existed but is permanently gone (expired/deleted)
- Browsers treat `301` as permanent — `410` tells them to stop retrying

---

### Edge Case 4: Cache Consistency After Update/Delete

**Problem:** URL owner deletes their link. Cache still has the old mapping.

```python
class URLService:
    async def delete_url(self, short_code: str, user_id: int) -> bool:
        # 1. Soft-delete in DB (never hard-delete — 410 semantics)
        result = await db.execute(
            \"\"\"UPDATE urls SET is_active = FALSE
               WHERE short_code = $1 AND user_id = $2\"\"\",
            short_code, user_id
        )
        if result.rowcount == 0:
            return False  # Not found or not owner

        # 2. Immediately invalidate cache
        await redis.delete(f"url:{short_code}")

        # 3. Publish invalidation event (for other cache layers / CDN)
        await kafka.publish("url_invalidations", {
            "short_code": short_code,
            "action": "deleted",
            "timestamp": datetime.utcnow().isoformat()
        })

        return True
```

**CDN Cache Invalidation:**
```python
# AWS CloudFront invalidation
import boto3

cf = boto3.client('cloudfront')
cf.create_invalidation(
    DistributionId='EXXXXXXXXXXXXXXX',
    InvalidationBatch={
        'Paths': {'Quantity': 1, 'Items': [f'/{short_code}']},
        'CallerReference': f'delete-{short_code}-{int(time.time())}'
    }
)
```

---

### Failure Mode 1: Redis Outage

```python
class ResilientURLResolver:
    async def resolve(self, short_code: str) -> str | None:
        try:
            # Try cache first
            cached = await asyncio.wait_for(
                redis.get(f"url:{short_code}"),
                timeout=0.050  # 50ms timeout — don't wait for slow Redis
            )
            if cached:
                return json.loads(cached)['long_url']
        except (asyncio.TimeoutError, ConnectionError):
            # Redis unavailable — fall through to DB
            metrics.increment('redis.fallback')

        # Fallback to PostgreSQL read replica
        row = await db.fetchrow(
            "SELECT long_url FROM urls WHERE short_code = $1 AND is_active = TRUE",
            short_code
        )
        return row['long_url'] if row else None
```

---

### Failure Mode 2: Database Primary Down

**Handled by:** PostgreSQL automatic failover with tools like Patroni or AWS RDS Multi-AZ.

```
Failover sequence:
1. Primary fails — health check detects in 10s
2. Patroni promotes replica to primary in ~30s
3. DNS TTL updates (Route 53, 30s TTL)
4. Application reconnects to new primary

Total outage: ~60-90 seconds for writes
Reads: unaffected (read replicas still up)
```

**Application-level:** Use connection string that always points to current primary:

```python
# Use a virtual IP or DNS name that Patroni updates
DB_WRITE_URL = "postgresql://db-primary.internal:5432/urls"
# Patroni updates the DNS record on failover
```

---

### Edge Case 5: Short Code Exhaustion (theoretical)

At 10M links/day with 7-char Base62, we have 964 years. But if code length is 6:

```python
def ensure_code_space():
    \"\"\"Monitor code space and alert if running low.\"\"\"
    used = db.fetchval("SELECT COUNT(*) FROM urls")
    total_capacity = 62 ** CURRENT_CODE_LENGTH  # 62^7
    utilization = used / total_capacity

    if utilization > 0.80:
        # Trigger migration to 8-character codes
        alert_engineering("Short code space 80% utilized — migrate to 8 chars")
```

**Migration strategy:** New links get 8-char codes. Old 7-char codes remain valid forever. The resolver handles both lengths transparently since it looks up by value, not by length.

---

### The "What if" Checklist

Always have answers to:

| Scenario | Response |
|---|---|
| Redis down | Fall through to DB replica, alert, auto-restart |
| DB primary down | Patroni failover ~60s, reads unaffected |
| Kafka down | Click events lost (acceptable), writes continue |
| Disk full | Alert at 80%, auto-scale EBS volume |
| DDoS on one short code | Rate limit by IP + CDN absorbs most traffic |
| Invalid URL submitted | Validate at API layer, reject with 400 |
| Circular redirect (bit.ly → tinyurl.com → bit.ly) | Detect cycles during URL creation |
""",

10: """## Session 10: Mock Interview — Full Transcript

This is a realistic 45-minute system design interview transcript. Study the pacing, question framing, and how the candidate handles pressure.

---

**Interviewer:** "Design a URL shortener like TinyURL. You have 45 minutes."

**Candidate:** "Sure, I'd love to. Before I start drawing, can I clarify a few requirements? I want to make sure I'm solving the right problem."

**Interviewer:** "Go ahead."

**Candidate:** "A few questions: First, what's the expected scale — are we building for millions of users or billions? Second, do we need analytics — click counts, geographic data? Third, do users need accounts, or is anonymous link creation fine? And fourth, should links expire?"

**Interviewer:** "Good questions. Let's say 500 million daily active users, basic analytics — just click counts, accounts are optional, and links can optionally have expiry."

**Candidate:** "Perfect. At 500M DAU, if 1 in 10 users creates a link daily, that's 50 million link creations per day. If each link gets clicked 20 times on average, that's 1 billion clicks per day. So roughly 580 writes per second and 11,600 reads per second on average, with 3x peak traffic. The read:write ratio is about 20:1, which means I'll aggressively cache the read path."

*[Candidate sketches the architecture on the whiteboard]*

**Candidate:** "Let me walk through the architecture. Users hit a CDN first — CloudFront. Cache misses hit load-balanced web servers. The web servers check Redis for cached URL mappings. Cache misses hit PostgreSQL read replicas. Writes go to a PostgreSQL primary. Click events go to Kafka asynchronously so they don't add latency to the redirect path."

**Interviewer:** "How do you generate the short codes?"

**Candidate:** "I'd use Base62 encoding — that's lowercase letters, uppercase letters, and digits — 62 characters total. For a 7-character code, that gives 62^7 or 3.5 trillion unique codes — essentially unlimited at our scale. I have three options for generation. Random — just pick 7 random characters and retry on collision. Hash-based — MD5 the long URL and take the first 7 chars. Or auto-increment — use the database primary key and Base62-encode it. I'd go with random generation because it's simple, collisions are extremely rare, and codes aren't guessable."

**Interviewer:** "What's the collision probability with random generation?"

**Candidate:** "The birthday paradox formula: for k items in a space of n, collision probability is roughly 1 - e^(-k²/2n). At 50 million links per day in a space of 3.5 trillion, the daily collision probability is about 1 - e^(-(50M)²/(2*3.5T)) which is roughly 0.03% per day. Trivial — a simple retry loop handles it."

**Interviewer:** "How would you handle 301 versus 302 redirects?"

**Candidate:** "Great distinction. 301 Moved Permanently means browsers cache the redirect locally — they never hit our servers again for that code. That's great for reducing load but terrible for analytics — we'd miss repeat clicks. 302 Found tells browsers to always re-request, so we capture every click. My design: anonymous links use 302 with no CDN caching to track clicks. The CDN still helps for first-time visitors globally. Premium links — where the user has opted out of analytics — could use 301."

**Interviewer:** "Your Redis cache is a single point of failure. How do you handle Redis going down?"

**Candidate:** "Two answers: prevent and recover. For prevention, I run Redis in cluster mode — 3 masters plus 3 replicas — so losing one node doesn't take down the cache. For recovery, I design the application to fail open gracefully. When Redis is unreachable, the web servers fall through to PostgreSQL read replicas. Our read replicas can handle the load — the cache reduces DB reads by 99%, but even at 100% DB load, we're talking about 12,000 reads per second, which is manageable with 5 read replicas and connection pooling. I'd set a 50ms Redis timeout — if Redis doesn't respond within 50ms, we go straight to the DB rather than waiting."

**Interviewer:** "How do you handle URL expiration?"

**Candidate:** "Two parts: serving expired links correctly, and cleaning up storage. For serving: every record has an `expires_at` timestamp. When resolving, I check this timestamp and return HTTP 410 Gone — not 404 — because 410 specifically means 'existed but is permanently gone,' which is semantically correct. For cleanup: I run a background job that scans the `expires_at` index — I have a partial index on `expires_at WHERE expires_at IS NOT NULL` — and soft-deletes records past their expiry. I keep them in the table for 30 days for any legal holds, then hard-delete after that."

**Interviewer:** "What would break first if traffic suddenly 10x'd to 100,000 reads per second?"

**Candidate:** "Let me think through the bottlenecks systematically. Web servers — stateless, Kubernetes auto-scales in 2 minutes. Not the bottleneck. Redis single cluster — at 100K reads/second, each Redis node handles about 33K ops/second. Three-node cluster starts approaching limits. I'd add more shards. The real bottleneck is probably the PostgreSQL read replicas for cache misses. At 100K reads/second with 99% cache hit rate, the DB sees 1,000 reads/second — that's fine. But if cache hit rate drops — say Redis is mid-scale — we could see 50,000 reads/second on DB, which would cause issues. My mitigation: pre-warm the cache before scaling events, and set connection pool limits to protect the DB."

**Interviewer:** "One last question: how would you prevent abuse — someone using your service to shorten a malware URL?"

**Candidate:** "Defense in layers. First, at creation time, I call Google Safe Browsing API synchronously — it returns in under 100ms and flags known malware, phishing, and malicious URLs. Any flagged URL gets rejected with a 422. Second, I scan for SSRF attack patterns in the URL itself — things like localhost, 169.254.x.x AWS metadata IPs, or private IP ranges. Third, I maintain a domain blocklist that I can update without deployment. Fourth, I accept reports from users — the analytics service tracks abuse reports and auto-deactivates links that exceed a threshold. Fifth, rate limiting by IP — free tier users get 10 link creations per minute, which limits bulk spam."

**Interviewer:** "Great. Thank you — that's our time."

---

### Post-Interview Reflection

**What went well:**
- Clarified requirements before designing
- Used real numbers throughout
- Addressed trade-offs explicitly (301 vs 302, random vs hash)
- Proactively handled failure modes
- Showed systematic thinking for bottleneck analysis

**What to improve:**
- Could have drawn a more detailed sequence diagram
- Didn't mention rate limiting until asked — bring it up proactively
- Could have discussed multi-region deployment for global scale

**Common failure modes in this interview:**
- Starting to draw without asking questions
- Ignoring the read:write ratio (cache design follows from this)
- Not knowing the difference between 301 and 302
- Saying "just add more servers" without specifics
- Not addressing failure modes at all
""",
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

print(f"Updated {len(CONTENT)} sessions for URL Shortener (part 2)")
