#!/usr/bin/env python3
"""Part 5: Rate Limiter — all 10 sessions"""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if "Rate Limiter" in d["topic"])
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## Session 1: Requirements & Scope

Rate limiting is a foundational infrastructure component. Every company at scale has one. This problem tests your understanding of distributed systems, algorithms, and API design.

### Clarifying Questions

**Candidate:** "Before designing, I want to understand the requirements. A few questions: Where is the rate limiter — client-side, server-side, or at a middleware layer? What are we rate limiting — requests per second, per minute, per day? Should we rate limit by IP, by user ID, by API key, or multiple dimensions? And what happens when a limit is exceeded — hard block or soft throttle?"

**Agreed scope:**
- Server-side rate limiter (not client-side — clients can't be trusted)
- Rate limit by: IP address, user ID, and API endpoint
- Rules: configurable (e.g., 100 req/min per user, 10 req/sec per IP)
- Exceeded: return HTTP 429 Too Many Requests with retry-after header
- Distributed: must work across multiple servers (single-server is trivial)

### Why Rate Limiting Matters

**Candidate:** "Rate limiting solves three distinct problems: (1) DDoS protection — prevent a malicious actor from overwhelming our servers with fake requests; (2) API fairness — prevent one customer from monopolizing shared infrastructure; (3) Cost control — on per-call APIs like OpenAI, rate limits prevent runaway bills."

### Where to Place the Rate Limiter

```mermaid
graph LR
    Client --> RL[Rate Limiter<br/>API Gateway] --> Services[Backend Services]
    RL -->|"429 Too Many Requests"| Client
```

Options:
1. **API Gateway** (AWS API Gateway, Kong, Nginx) — easiest, centralized
2. **Middleware in each service** — more flexible, distributed
3. **Dedicated rate limit service** — most powerful, separate concern

"I'll design a dedicated rate limiting service that's called by the API Gateway. This gives us centralized control, easy configuration changes, and independent scaling."

### Non-Functional Requirements

| Requirement | Target |
|---|---|
| Latency added | < 5ms P99 (must be fast — on every request) |
| Accuracy | ±5% acceptable (no algorithm is perfect at scale) |
| Availability | 99.99% (if rate limiter is down, should fail open) |
| Distribution | Must work across 100+ servers |
| Configurability | Rules changeable without deployment |

**Critical insight:** "The rate limiter is in the critical path of every API call. A 50ms rate limiter doubles latency. It MUST be sub-millisecond locally or use async calls."
""",

2: """## Session 2: Capacity Estimation

### Traffic to Rate Limiter

```
API traffic: 1M requests/second
Rate limiter called on EVERY request → 1M checks/sec

Per check:
  1. Identify requester (IP/user_id): 0ms (from request headers)
  2. Check counter in Redis: 1-2ms
  3. Increment counter: 0.1ms (pipelined with check)

Total overhead per request: ~2ms
```

### Redis Memory for Counters

```
Rate limit rule types:
  Per-user, per-minute: 100M DAU * 1 counter = 100M keys
  Per-IP, per-minute: ~50M unique IPs active
  Per-endpoint, per-user, per-minute: 100M * 20 endpoints = 2B keys (too many)
  → In practice: 3-4 dimensions, ~200M active keys at peak

Per key size:
  Key: "rl:user:12345:POST/api/v1/messages:2024011510" = 45 bytes
  Value: integer counter = 8 bytes
  Redis overhead: ~100 bytes per key

Total memory: 200M * 100 bytes = 20 GB
With Redis Cluster (3 shards): 7 GB per shard — very manageable
```

### Rule Storage

```
Rules are configuration, not hot path:
  Number of rules: ~1,000 (endpoints × user tiers)
  Rule size: ~200 bytes
  Total: 200 KB — fits in any cache, even application memory
```

### Rate Limiter Infrastructure

```
At 1M req/sec, 1 Redis node handles ~100K ops/sec:
  Need: 10 Redis nodes minimum
  With Redis Cluster (6 masters): ~600K ops/sec
  Add replicas: 12 nodes total for HA

Rate limiter service instances:
  Each instance: 10K concurrent checks
  100 instances needed (horizontally scalable)
```
""",

3: """## Session 3: API Design

### HTTP Response Headers (Industry Standard)

Every rate-limited API should return these headers on every response:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705316400
X-RateLimit-Policy: 100;w=60  (100 requests per 60-second window)
```

When limit exceeded:
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705316400
Retry-After: 23  (seconds until window resets)

{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please wait 23 seconds.",
  "limit": 100,
  "window": "60s",
  "retry_after": 23
}
```

### Internal Rate Limiter gRPC API

```protobuf
syntax = "proto3";

service RateLimiter {
  rpc CheckRateLimit(RateLimitRequest) returns (RateLimitResponse);
  rpc GetRules(GetRulesRequest) returns (GetRulesResponse);
  rpc UpdateRule(UpdateRuleRequest) returns (UpdateRuleResponse);
}

message RateLimitRequest {
  string identifier = 1;     // user_id or IP address
  string resource   = 2;     // endpoint path, e.g., "POST:/v1/messages"
  string client_ip  = 3;     // for IP-based rules
  map<string, string> labels = 4;  // extra dimensions
}

message RateLimitResponse {
  bool   allowed       = 1;
  int64  limit         = 2;
  int64  remaining     = 3;
  int64  reset_at      = 4;   // Unix timestamp
  int64  retry_after   = 5;   // seconds (only if !allowed)
  string matched_rule  = 6;   // which rule triggered
}

message Rule {
  string  id            = 1;
  string  resource      = 2;   // "POST:/v1/messages" or "*"
  string  subject_type  = 3;   // "user", "ip", "api_key"
  int64   limit         = 4;   // max requests
  int64   window_secs   = 5;   // window duration
  string  tier          = 6;   // "free", "pro", "enterprise"
}
```

### Middleware Integration

```python
# FastAPI middleware example
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
import grpc

app = FastAPI()
rate_limiter_stub = RateLimiterStub(grpc.aio.insecure_channel("rate-limiter:50051"))

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    user_id = extract_user_id(request)
    resource = f"{request.method}:{request.url.path}"

    check = await rate_limiter_stub.CheckRateLimit(RateLimitRequest(
        identifier=user_id or "",
        resource=resource,
        client_ip=request.client.host,
    ))

    # Always add headers (even for allowed requests)
    headers = {
        "X-RateLimit-Limit": str(check.limit),
        "X-RateLimit-Remaining": str(check.remaining),
        "X-RateLimit-Reset": str(check.reset_at),
    }

    if not check.allowed:
        headers["Retry-After"] = str(check.retry_after)
        return JSONResponse(
            status_code=429,
            content={
                "error": "RATE_LIMIT_EXCEEDED",
                "message": f"Too many requests. Retry after {check.retry_after}s.",
                "retry_after": check.retry_after,
            },
            headers=headers,
        )

    response = await call_next(request)
    for key, val in headers.items():
        response.headers[key] = val
    return response
```

### TypeScript Rate Limit Client

```typescript
// Rate limit hook for frontend
export function useRateLimitAwareRequest() {
  const [retryAfter, setRetryAfter] = useState<number | null>(null)

  const request = async (url: string, options: RequestInit) => {
    if (retryAfter !== null) {
      throw new Error(`Rate limited. Retry in ${retryAfter}s`)
    }

    const response = await fetch(url, options)

    if (response.status === 429) {
      const retrySeconds = parseInt(response.headers.get('Retry-After') ?? '60')
      setRetryAfter(retrySeconds)
      setTimeout(() => setRetryAfter(null), retrySeconds * 1000)
      throw new Error('Rate limited')
    }

    return response
  }

  return { request, retryAfter }
}
```
""",

4: """## Session 4: Database Schema & Storage

### Rule Storage: Database

Rules are configuration data — low volume, need CRUD operations, human-readable.

```sql
CREATE TABLE rate_limit_rules (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    resource    VARCHAR(200) NOT NULL,  -- "POST:/v1/messages" or "*"
    subject_type VARCHAR(20) NOT NULL,  -- "user_id", "ip", "api_key"
    tier        VARCHAR(50),            -- "free", "pro", NULL=all tiers
    limit_count BIGINT NOT NULL,        -- max requests allowed
    window_secs INT NOT NULL,           -- window size in seconds
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Examples of rules
INSERT INTO rate_limit_rules (name, resource, subject_type, tier, limit_count, window_secs) VALUES
  ('api_post_free',      'POST:/v1/messages', 'user_id', 'free',       100,    60),
  ('api_post_pro',       'POST:/v1/messages', 'user_id', 'pro',       1000,    60),
  ('api_global_ip',      '*',                 'ip',       NULL,        1000,    60),
  ('api_get_feed',       'GET:/v1/feed',      'user_id',  NULL,         600,    60),
  ('auth_login',         'POST:/v1/auth/login','ip',      NULL,           5,    60),
  ('auth_signup',        'POST:/v1/auth/signup','ip',     NULL,           3,   300);
```

### Counter Storage: Redis

```
# Fixed Window Counter
Key pattern: rl:{algorithm}:{subject_type}:{identifier}:{resource_hash}:{window_id}

# Example:
Key:   rl:fw:user:12345:abc789:202401151030
       (fw=fixed window, user 12345, resource hash abc789, window = minute 1030 of Jan 15 2024)
Value: 87 (current count)
TTL:   60 (expire after window closes)

# Sliding Window Log
Key:   rl:sl:user:12345:abc789
Type:  Redis Sorted Set
Members: {request_id}
Scores: {unix_timestamp_ms}
TTL:   {window_size + buffer}

# Token Bucket
Key:   rl:tb:user:12345:abc789
Value: JSON {tokens: 87.5, last_refill: 1705316400.123}
TTL:   3600 (expire if user inactive)
```

### Rule Cache (Application Memory)

Rules are loaded into application memory at startup and refreshed every 60 seconds:

```python
class RuleCache:
    def __init__(self, db, refresh_interval: int = 60):
        self.db = db
        self.rules: list[Rule] = []
        self.refresh_interval = refresh_interval
        self._lock = asyncio.Lock()

    async def start(self):
        await self.refresh()
        asyncio.create_task(self._refresh_loop())

    async def _refresh_loop(self):
        while True:
            await asyncio.sleep(self.refresh_interval)
            await self.refresh()

    async def refresh(self):
        async with self._lock:
            rows = await self.db.fetch(
                "SELECT * FROM rate_limit_rules WHERE is_active = TRUE ORDER BY specificity DESC"
            )
            self.rules = [Rule(**dict(row)) for row in rows]

    def find_rule(self, identifier: str, resource: str, tier: str) -> Rule | None:
        \"\"\"Find most specific matching rule.\"\"\"
        for rule in self.rules:
            if self._matches(rule, identifier, resource, tier):
                return rule
        return None

    def _matches(self, rule: Rule, identifier: str, resource: str, tier: str) -> bool:
        resource_match = rule.resource == "*" or rule.resource == resource
        tier_match = rule.tier is None or rule.tier == tier
        return resource_match and tier_match
```
""",

5: """## Session 5: High-Level Architecture

### Full System

```mermaid
graph TB
    Client([API Client])

    subgraph GW ["API Gateway"]
        Gateway[Kong / Nginx<br/>Rate Limit Middleware]
    end

    subgraph RL ["Rate Limiter Service"]
        RL1[Rate Limiter Instance 1]
        RL2[Rate Limiter Instance 2]
        RL3[Rate Limiter Instance N]
        RuleCache[In-Memory Rule Cache<br/>refreshed every 60s]
    end

    subgraph Store ["State Store"]
        R1[Redis Master 1]
        R2[Redis Master 2]
        R3[Redis Master 3]
        RR1[Replica 1]
        RR2[Replica 2]
        RR3[Replica 3]
    end

    subgraph Config ["Configuration"]
        DB[(PostgreSQL<br/>Rate Limit Rules)]
        Admin[Admin Dashboard]
    end

    subgraph Backend ["Backend Services"]
        SVC1[Service A]
        SVC2[Service B]
    end

    Client --> Gateway
    Gateway --> RL1 & RL2 & RL3
    RL1 & RL2 & RL3 --> R1 & R2 & R3
    R1 --- RR1
    R2 --- RR2
    R3 --- RR3
    RL1 & RL2 & RL3 --- RuleCache
    DB --> RuleCache
    Admin --> DB
    Gateway --> SVC1 & SVC2
```

### Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant RL as Rate Limiter Service
    participant Redis
    participant Svc as Backend Service

    C->>GW: API Request (user_id=123, POST /v1/messages)
    GW->>RL: CheckRateLimit(user_id=123, resource=POST:/v1/messages)

    RL->>RL: Lookup rule from in-memory cache
    Note over RL: Rule: 100 req/min for free tier

    RL->>Redis: MULTI / pipeline
    RL->>Redis: INCR rl:fw:user:123:abc:202401151030
    RL->>Redis: EXPIRE rl:fw:user:123:abc:202401151030 60
    Redis-->>RL: count=87

    RL-->>GW: {allowed: true, remaining: 13, reset_at: 1705316400}

    GW->>Svc: Forward request
    Svc-->>GW: 200 OK
    GW-->>C: 200 OK + X-RateLimit-* headers

    Note over C,GW: 14th request in same window
    C->>GW: API Request
    GW->>RL: CheckRateLimit(...)
    RL->>Redis: INCR → count=101
    RL-->>GW: {allowed: false, remaining: 0, retry_after: 23}
    GW-->>C: 429 Too Many Requests
```

### Fail-Open Design

**Critical design principle:** If the rate limiter goes down, requests should be ALLOWED (fail open), not blocked.

```python
async def check_with_failsafe(request: RateLimitRequest) -> RateLimitResponse:
    try:
        result = await asyncio.wait_for(
            _check_redis(request),
            timeout=0.010  # 10ms timeout — if slower, fail open
        )
        return result
    except (asyncio.TimeoutError, redis.RedisError, Exception):
        # Fail OPEN: better to let some traffic through than block everyone
        metrics.increment("rate_limiter.failopen")
        logger.warning("Rate limiter unavailable — failing open")
        return RateLimitResponse(
            allowed=True,
            limit=0,
            remaining=0,
            reset_at=0
        )
```

**Interviewer:** "Isn't fail-open risky? A DDoS attack during an outage?"

**Candidate:** "Yes, there's a risk. But the alternative — fail-closed — means our service is completely unavailable whenever Redis has issues. In practice, we have multiple layers of protection: CDN-level rate limiting, load balancer connection limits, and OS-level TCP connection limits. The rate limiter is one layer. Fail-open during a brief outage is acceptable; total service unavailability is not."
""",

6: """## Session 6: Deep Dive — Rate Limiting Algorithms

This is the core of the rate limiter interview. You must know all 5 algorithms and their trade-offs cold.

### Algorithm 1: Fixed Window Counter

**Concept:** Divide time into fixed windows (e.g., each minute). Count requests per window.

```python
import redis.asyncio as aioredis
import time

redis = aioredis.from_url("redis://localhost")

async def check_fixed_window(identifier: str, limit: int, window_secs: int) -> tuple[bool, int]:
    \"\"\"Returns (allowed, remaining).\"\"\"
    # Window ID: which minute/hour/etc we're in
    window_id = int(time.time()) // window_secs
    key = f"rl:fw:{identifier}:{window_id}"

    # Atomic increment + get
    count = await redis.incr(key)
    if count == 1:
        # First request in this window — set TTL
        await redis.expire(key, window_secs)

    allowed = count <= limit
    remaining = max(0, limit - count)
    return allowed, remaining

# Usage:
allowed, remaining = await check_fixed_window("user:123", limit=100, window_secs=60)
```

**Pros:** Simple, O(1) space and time per check.

**Cons: The Boundary Spike Problem**

```
Limit: 100 requests/minute
Window 1 (00:00 - 01:00): 100 requests sent at 00:59
Window 2 (01:00 - 02:00): 100 requests sent at 01:01

Result: 200 requests in 2 seconds! The "boundary spike."
```

---

### Algorithm 2: Sliding Window Log

**Concept:** Record a timestamp for every request. Count timestamps within the window.

```python
async def check_sliding_window_log(identifier: str, limit: int, window_secs: int) -> tuple[bool, int]:
    key = f"rl:sl:{identifier}"
    now = time.time()
    window_start = now - window_secs

    pipe = redis.pipeline()
    # Remove timestamps outside the window
    pipe.zremrangebyscore(key, "-inf", window_start)
    # Count remaining timestamps
    pipe.zcard(key)
    # Add current timestamp
    pipe.zadd(key, {str(now): now})
    # Set TTL
    pipe.expire(key, window_secs + 1)
    results = await pipe.execute()

    count = results[1]  # count BEFORE adding current request
    allowed = count < limit
    remaining = max(0, limit - count - (1 if allowed else 0))
    return allowed, remaining
```

**Pros:** Accurate — no boundary spike.

**Cons:** O(limit) memory per user (stores every timestamp). At 100 req/min, 100 timestamps per user. At 100M users, 10B entries — 1TB+ of memory. **Not practical at scale.**

---

### Algorithm 3: Sliding Window Counter (Best for Production)

**Concept:** Hybrid of fixed window and sliding window. Uses two fixed-window counters.

```python
async def check_sliding_window_counter(
    identifier: str, limit: int, window_secs: int
) -> tuple[bool, int]:
    \"\"\"
    Approximation: weight previous window by how far we are into current window.
    Error < 5% in practice.
    \"\"\"
    now = time.time()
    current_window = int(now) // window_secs
    previous_window = current_window - 1

    key_current = f"rl:fw:{identifier}:{current_window}"
    key_previous = f"rl:fw:{identifier}:{previous_window}"

    pipe = redis.pipeline()
    pipe.get(key_current)
    pipe.get(key_previous)
    results = await pipe.execute()

    current_count = int(results[0] or 0)
    previous_count = int(results[1] or 0)

    # How far into the current window are we? (0.0 to 1.0)
    elapsed = (now % window_secs) / window_secs

    # Weighted count: previous window weighted by time remaining
    weighted_count = previous_count * (1 - elapsed) + current_count

    if weighted_count >= limit:
        return False, 0

    # Increment current window
    pipe = redis.pipeline()
    pipe.incr(key_current)
    pipe.expire(key_current, window_secs * 2)
    await pipe.execute()

    remaining = max(0, limit - int(weighted_count) - 1)
    return True, remaining
```

**Pros:** O(1) space (only 2 counters), accurate to within ~5%, no boundary spike.

**This is what Cloudflare uses in production.**

---

### Algorithm 4: Token Bucket

**Concept:** Each user has a "bucket" of tokens. Each request consumes 1 token. Tokens refill at a fixed rate.

```python
import json

async def check_token_bucket(
    identifier: str,
    capacity: int,      # max tokens (burst limit)
    refill_rate: float  # tokens per second
) -> tuple[bool, int]:
    key = f"rl:tb:{identifier}"
    now = time.time()

    # Get current state
    raw = await redis.get(key)
    if raw:
        state = json.loads(raw)
        tokens = state["tokens"]
        last_refill = state["last_refill"]
    else:
        # New user: start with full bucket
        tokens = capacity
        last_refill = now

    # Refill tokens based on elapsed time
    elapsed = now - last_refill
    new_tokens = min(capacity, tokens + elapsed * refill_rate)

    if new_tokens < 1:
        # No tokens available
        retry_after = (1 - new_tokens) / refill_rate
        return False, 0

    # Consume one token
    new_tokens -= 1
    await redis.setex(key, 3600, json.dumps({
        "tokens": new_tokens,
        "last_refill": now
    }))

    return True, int(new_tokens)
```

**Pros:** Allows bursting (unused capacity accumulates). Natural for APIs that want to allow short bursts.

**Cons:** Requires compare-and-swap atomic operation across read-compute-write. Race condition risk in naïve implementation — needs Lua script for atomicity.

**Redis Lua script for atomic token bucket:**

```lua
-- token_bucket.lua
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local state = redis.call("GET", key)
local tokens, last_refill

if state then
    local parsed = cjson.decode(state)
    tokens = parsed.tokens
    last_refill = parsed.last_refill
else
    tokens = capacity
    last_refill = now
end

-- Refill
local elapsed = now - last_refill
tokens = math.min(capacity, tokens + elapsed * refill_rate)

if tokens < 1 then
    return {0, 0}  -- denied, 0 remaining
end

tokens = tokens - 1
redis.call("SETEX", key, 3600, cjson.encode({tokens=tokens, last_refill=now}))
return {1, math.floor(tokens)}  -- allowed, remaining tokens
```

---

### Algorithm 5: Leaky Bucket

**Concept:** Requests enter a queue. Queue "leaks" (processes) at a constant rate. If queue is full, request is rejected.

**Use case:** Smoothing bursty traffic to a constant output rate. Used in network routers and CDNs.

```
Analogy: A bucket with a hole in the bottom.
Water (requests) pours in at any rate.
Water drips out at a constant rate (processing speed).
If bucket overflows → request dropped.
```

```python
import asyncio

class LeakyBucket:
    def __init__(self, capacity: int, leak_rate: float):
        self.capacity = capacity
        self.leak_rate = leak_rate  # requests per second to process
        self.queue = asyncio.Queue(maxsize=capacity)

    async def add_request(self, request) -> bool:
        try:
            self.queue.put_nowait(request)
            return True  # Accepted into queue
        except asyncio.QueueFull:
            return False  # Rejected — bucket full

    async def process_requests(self):
        while True:
            if not self.queue.empty():
                request = await self.queue.get()
                await process(request)
            await asyncio.sleep(1.0 / self.leak_rate)
```

---

### Algorithm Comparison

| Algorithm | Space | Accuracy | Burst | Complexity | Use Case |
|---|---|---|---|---|---|
| Fixed Window | O(1) | Low (boundary spike) | Allows | Very simple | Quick prototypes |
| Sliding Window Log | O(limit) | Perfect | No | Simple | Low traffic, high accuracy |
| Sliding Window Counter | O(1) | ~95% | No | Moderate | Production (Cloudflare) |
| Token Bucket | O(1) | High | Yes | Moderate | APIs with bursty clients |
| Leaky Bucket | O(capacity) | Perfect output rate | No | Complex | Network traffic shaping |

**Interview answer:** "I'd use the sliding window counter as the default — O(1) space, 95%+ accuracy, no boundary spike, and it's battle-tested by Cloudflare. For APIs where burst tolerance is important (like a code editor auto-save), I'd use token bucket."
""",

7: """## Session 7: Deep Dive — Distributed Rate Limiting

Single-server rate limiting is trivial. The challenge is maintaining accurate counts when the rate limiter runs on 100+ servers.

### The Problem: Inconsistent Counts

```
Without central state:
  User sends 120 requests/minute
  50 requests hit Server 1 → Server 1 sees 50, allows all
  50 requests hit Server 2 → Server 2 sees 50, allows all
  20 requests hit Server 3 → Server 3 sees 20, allows all
  Total: 120 requests allowed! Limit was 100.
```

### Solution 1: Centralized Redis (Our Design)

All servers check the same Redis counter:

```python
# Server 1, 2, 3 all call the same Redis:
count = await redis.incr(f"rl:{identifier}:{window}")
allowed = count <= limit
```

**Pros:** Globally accurate.

**Cons:** Redis becomes a bottleneck. Adds 1-2ms per request. Single point of failure.

**Optimization: Redis Cluster with consistent hashing**

```python
class DistributedRateLimiter:
    def __init__(self, redis_cluster):
        self.redis = redis_cluster  # Redis Cluster handles key routing

    async def check(self, identifier: str, limit: int, window_secs: int) -> bool:
        # Redis Cluster routes this key to the correct shard automatically
        key = f"rl:{identifier}:{int(time.time()) // window_secs}"
        count = await self.redis.incr(key)
        if count == 1:
            await self.redis.expire(key, window_secs)
        return count <= limit
```

All keys for the same user land on the same Redis shard (via consistent hashing on the key). This eliminates cross-shard coordination.

### Solution 2: Local Counters + Gossip (Eventually Consistent)

For systems where 5-10% over-limit is acceptable:

```python
class GossipRateLimiter:
    def __init__(self, server_id: str, peers: list[str]):
        self.server_id = server_id
        self.local_counts: dict[str, int] = {}  # local only
        self.global_estimates: dict[str, int] = {}  # gossip estimates
        self.peers = peers  # other rate limiter servers

    async def check(self, identifier: str, limit: int) -> bool:
        local = self.local_counts.get(identifier, 0)
        global_estimate = self.global_estimates.get(identifier, 0)

        # Use local count + global estimate from last gossip round
        total_estimate = local + global_estimate

        if total_estimate >= limit:
            return False

        self.local_counts[identifier] = local + 1
        return True

    async def gossip(self):
        \"\"\"Periodically share local counts with peers.\"\"\"
        while True:
            for peer in self.peers:
                try:
                    await self._sync_with_peer(peer)
                except Exception:
                    pass  # best-effort gossip
            await asyncio.sleep(1.0)  # gossip every second
```

**Pros:** No Redis dependency, sub-millisecond latency.

**Cons:** ~10% inaccuracy during gossip intervals. A user could exceed limit by (number of servers × local count) before gossip catches up.

**Used by:** Netflix (Hystrix), some edge CDNs.

### Solution 3: Local Counter with Async Redis Sync

Compromise — fast local check, async sync to Redis:

```python
class HybridRateLimiter:
    def __init__(self, redis, sync_interval: float = 0.1):
        self.redis = redis
        self.local_counts: dict[str, int] = {}
        self.sync_interval = sync_interval

    async def check(self, identifier: str, limit: int, window_secs: int) -> bool:
        # Fast local check (0ms — no network)
        local = self.local_counts.get(identifier, 0)
        # Use 90% of limit for local fast-path (reserve 10% buffer for sync lag)
        if local >= limit * 0.9:
            # Slow path: check Redis for accurate global count
            return await self._redis_check(identifier, limit, window_secs)

        # Fast path: increment locally
        self.local_counts[identifier] = local + 1
        return True

    async def _sync_to_redis(self):
        \"\"\"Background task: flush local counts to Redis every 100ms.\"\"\"
        while True:
            await asyncio.sleep(self.sync_interval)
            for identifier, delta in list(self.local_counts.items()):
                if delta > 0:
                    await self.redis.incrby(f"global:{identifier}", delta)
                    self.local_counts[identifier] = 0
```

### Rate Limiting at the Edge (CDN-Level)

For DDoS protection, rate limiting must happen before traffic reaches your servers:

```
CloudFront / Cloudflare rate limiting:
  Rule: Block IP if > 1000 req/sec
  Implementation: Cloudflare's distributed counters (proprietary)
  Latency: 0ms (enforced in CDN edge network, never reaches origin)

Use for:
  - Layer 7 DDoS protection
  - Geographic rate limiting
  - Bot mitigation

Combine with:
  - Application-level rate limiting (per user, per API)
  - Database-level rate limiting (query rate limits)
```

### Race Condition: The Check-Then-Act Problem

```python
# WRONG - race condition:
count = await redis.get(key)  # reads 99
if count < 100:               # 99 < 100 = True
    await redis.incr(key)     # increments to 100
    return True               # Two concurrent requests both reach this line!

# RIGHT - atomic INCR:
count = await redis.incr(key)  # atomically increments to 100 (or 101 for concurrent)
return count <= 100            # only one of the concurrent requests gets 100
```

Redis `INCR` is atomic — no race condition. Always use `INCR` not `GET + SET`.
""",

8: """## Session 8: Scaling & Edge Cases

### Scaling the Rate Limiter

```
At 1M req/sec:
  Each rate limit check: 1 Redis INCR + 1 EXPIRE = 2 ops
  Total Redis ops: 2M ops/sec

Single Redis node: ~200K ops/sec → need 10+ nodes
Redis Cluster (10 masters): 2M ops/sec capacity ✓

Rate limiter service instances:
  Each handles 10K concurrent gRPC calls
  100 instances for 1M req/sec with headroom
```

### Multi-Dimensional Rate Limiting

Real systems need multiple simultaneous limits:

```python
async def check_all_limits(
    user_id: str,
    ip: str,
    resource: str,
    tier: str
) -> RateLimitResponse:
    \"\"\"Check all applicable rules simultaneously.\"\"\"
    rules = rule_cache.find_all_rules(user_id, ip, resource, tier)

    # Run all checks in parallel
    checks = await asyncio.gather(*[
        check_rule(rule, user_id, ip) for rule in rules
    ])

    # Deny if ANY rule is exceeded
    for check, rule in zip(checks, rules):
        if not check.allowed:
            return RateLimitResponse(
                allowed=False,
                limit=rule.limit_count,
                remaining=0,
                matched_rule=rule.name,
                retry_after=check.retry_after
            )

    # All passed — return most restrictive remaining count
    most_restrictive = min(checks, key=lambda c: c.remaining)
    return most_restrictive
```

### Adaptive Rate Limiting

Dynamically tighten limits under server stress:

```python
class AdaptiveRateLimiter:
    def __init__(self, base_limit: int):
        self.base_limit = base_limit
        self.current_multiplier = 1.0

    async def adjust_for_load(self, server_cpu_pct: float, error_rate: float):
        \"\"\"Reduce limits when servers are under stress.\"\"\"
        if server_cpu_pct > 90 or error_rate > 0.05:
            # Shed 50% of traffic
            self.current_multiplier = 0.5
        elif server_cpu_pct > 70 or error_rate > 0.02:
            # Shed 25% of traffic
            self.current_multiplier = 0.75
        else:
            # Normal operation
            self.current_multiplier = 1.0

    def effective_limit(self, tier: str) -> int:
        return int(self.base_limit * self.current_multiplier)
```

### Allowlist & Denylist

```python
ALLOWLIST = {"internal-service", "health-check-bot"}  # Never rate limited
DENYLIST = {"known-spammer-ip", "abuser-user-id"}   # Always blocked

async def check_with_lists(identifier: str) -> RateLimitResponse:
    if identifier in DENYLIST:
        return RateLimitResponse(allowed=False, retry_after=3600)
    if identifier in ALLOWLIST:
        return RateLimitResponse(allowed=True, remaining=999999)
    # Normal rate limit check
    return await check_rate_limit(identifier)
```

### Edge Case: Clock Skew Between Servers

```
Server 1 clock: 10:30:00.000
Server 2 clock: 10:30:00.500 (500ms ahead)

User sends 100 requests in minute 10:30:
  50 to Server 1 → window key = "...1030"
  50 to Server 2 → clock is 500ms ahead

If at 10:30:59.700 on Server 1 = 10:31:00.200 on Server 2:
  Server 2 creates a NEW window key "...1031"
  User gets 50 extra requests!
```

**Solution: NTP with <50ms tolerance. Use server time only for window calculation, never for comparison.**

In practice, cloud providers guarantee <5ms clock skew with NTP.

### Edge Case: Redis Key Collision

Two different users with the same hash → same counter (hash collision).

```python
# Use cryptographic hash to minimize collision probability:
import hashlib

def make_key(user_id: str, resource: str, window_id: int) -> str:
    # SHA-256 first 8 bytes → 2^64 space → collision probability negligible
    payload = f"{user_id}:{resource}:{window_id}".encode()
    hash_hex = hashlib.sha256(payload).hexdigest()[:16]
    return f"rl:{hash_hex}"
```

With 200M active keys and SHA-256-based 64-bit key space, collision probability is ~10^-9 — negligible.
""",

9: """## Session 9: Edge Cases & Failure Modes

### Edge Case 1: Retry Storm After 429

When a client receives 429, it may immediately retry, creating a retry storm.

**Solution: Retry-After header + exponential backoff guidance**

```python
# Server response
def make_429_response(retry_after: int) -> Response:
    return JSONResponse(
        status_code=429,
        content={
            "error": "RATE_LIMIT_EXCEEDED",
            "retry_after": retry_after,
            "message": f"Please retry after {retry_after} seconds. "
                       "Use exponential backoff for subsequent retries."
        },
        headers={
            "Retry-After": str(retry_after),
            "X-RateLimit-Reset": str(int(time.time()) + retry_after)
        }
    )

# Client-side: exponential backoff with jitter
async def request_with_retry(url: str, max_retries: int = 3):
    for attempt in range(max_retries):
        response = await http.get(url)
        if response.status != 429:
            return response

        retry_after = int(response.headers.get("Retry-After", "60"))
        # Add jitter to prevent synchronized retries
        wait = retry_after * (2 ** attempt) + random.uniform(0, 1)
        await asyncio.sleep(min(wait, 300))  # max 5 minutes

    raise Exception("Max retries exceeded")
```

### Edge Case 2: Redis Failover Mid-Window

Redis primary fails. Replica promoted. The replica may be slightly behind (replication lag).

**Scenario:**
```
User sends 95 requests → primary has count=95
Primary fails at t=30s
Replica promoted with count=90 (5 requests lost in replication lag)
User sends 15 more requests → replica allows all (90+15=105 ≤ limit? → depends on limit)
User effectively sends 110 requests in the window
```

**Solution options:**
1. Accept ~5-10% over-limit during failover (usually acceptable)
2. Use Redis Sentinel / Redis Cluster with synchronous replication (reduces replication lag to near 0)
3. Use `WAIT 1 0` command to ensure write is replicated before returning

```python
async def incr_with_replication_wait(key: str) -> int:
    count = await redis.incr(key)
    # Wait for at least 1 replica to confirm (0 timeout = no wait for replica if unavailable)
    await redis.execute_command("WAIT", 1, 50)  # 50ms timeout
    return count
```

### Edge Case 3: Rate Limiting Distributed Across Time Zones

A user's API plan resets daily. "Daily" means different things:

```python
# Option A: UTC midnight reset (simple, consistent)
def get_daily_window_id() -> str:
    return datetime.utcnow().strftime("%Y%m%d")

# Option B: User's local midnight (fair but complex)
async def get_user_daily_window_id(user_id: str) -> str:
    user_tz = await get_user_timezone(user_id)
    tz = pytz.timezone(user_tz)
    local_now = datetime.now(tz)
    return local_now.strftime("%Y%m%d")

# Option C: Rolling 24-hour window (most fair — sliding window approach)
# Same as sliding window counter but with 86400 second window
```

**Interview answer:** "I'd use UTC midnight for simplicity. The alternative is user-timezone-aware windows which add complexity without significant user benefit. I'd document this clearly in the API."

### Failure Mode 1: Rate Limiter Service Crash

If the entire rate limiter service crashes:

```python
# API Gateway fallback policy
async def check_rate_limit_with_fallback(request: RateLimitRequest) -> RateLimitResponse:
    try:
        # 10ms timeout to rate limiter service
        result = await asyncio.wait_for(
            rate_limiter_stub.CheckRateLimit(request),
            timeout=0.010
        )
        return result
    except Exception:
        # Fail open — let traffic through
        # Log + alert, but don't block users
        return RateLimitResponse(allowed=True, limit=-1, remaining=-1)
```

**Alerting:** Monitor the rate limiter's availability and error rate separately. PagerDuty alert if fail-open mode activates.

### Failure Mode 2: Redis Memory Full

If Redis runs out of memory, new keys can't be created.

```python
# Redis configuration for graceful degradation
# maxmemory-policy: allkeys-lru
# When memory full, evict least-recently-used keys
# This means old rate limit windows (low traffic users) get evicted first
# High-traffic users' keys stay in memory (accessed recently)

# Monitor memory usage
redis_info = await redis.info("memory")
used_memory = redis_info["used_memory"]
max_memory = redis_info["maxmemory"]

if used_memory / max_memory > 0.85:
    alert_engineering("Redis rate limit store at 85% capacity — add nodes")
```

### Failure Mode 3: Admin Updates Wrong Rule

An admin accidentally sets `POST /v1/messages` limit to 0 (blocks all traffic).

```python
class RuleUpdateService:
    async def update_rule(self, rule_id: int, updates: dict, admin_id: str):
        # Validation
        if updates.get("limit_count", 1) <= 0:
            raise ValueError("Rate limit cannot be zero or negative")

        # Shadow mode: test new rule without enforcing
        if updates.get("shadow_mode"):
            await self.apply_shadow_rule(rule_id, updates)
            return

        # Staged rollout: apply to 1% of traffic first
        await self.apply_with_canary(rule_id, updates, canary_pct=0.01)

        # Log all changes for audit trail
        await self.audit_log.record({
            "action": "rule_update",
            "rule_id": rule_id,
            "admin_id": admin_id,
            "old_values": await self.get_rule(rule_id),
            "new_values": updates,
            "timestamp": datetime.utcnow().isoformat()
        })
```
""",

10: """## Session 10: Mock Interview — Rate Limiter

**Interviewer:** "Design a rate limiter."

**Candidate:** "Quick clarifying questions: is this rate limiter for our own internal services, or a product feature for customers? Are we limiting by IP, by user ID, by API key? And what are the business requirements — is this for DDoS protection, API monetization, or fairness?"

**Interviewer:** "It's server-side, both IP and user ID, for API fairness and DDoS protection. Target: 1 million requests per second."

**Candidate:** "At 1M requests per second, the rate limiter must be extremely fast. Any approach that adds more than 5ms per request is unacceptable. That rules out synchronous database calls on every request. I'll use Redis for counter storage — it's in-memory, single-digit millisecond latency, and `INCR` is atomic.

Let me walk through the algorithm choices. I see five: fixed window, sliding window log, sliding window counter, token bucket, and leaky bucket. Fixed window is too simple — it has a boundary spike problem where a user can double their limit by sending requests right before and after a window boundary. Sliding window log is accurate but stores one timestamp per request — at 100 requests/minute per user across 100M users, that's 10 billion Redis entries. Not practical.

I'd use sliding window counter. It keeps only two integers per user — current window count and previous window count — and weights them by how far into the current window we are. Accuracy is within 5%, space is O(1). This is what Cloudflare uses."

**Interviewer:** "Show me how the sliding window counter works."

**Candidate:** "Sure. Window size is 60 seconds. Say the window started at 10:30:00. User has made 80 requests this window. The previous window (10:29:00-10:30:00) saw 100 requests. It's now 10:30:45 — 45 seconds into the current window.

The weighted count is: previous_count × (1 - elapsed/window) + current_count = 100 × (1 - 45/60) + 80 = 100 × 0.25 + 80 = 25 + 80 = 105. If the limit is 100, we deny. The intuition is: 75% of the previous window's requests have 'faded out,' leaving only the most recent traffic in view."

**Interviewer:** "How do you distribute this across 100 rate limiter servers?"

**Candidate:** "Central Redis. All 100 rate limiter servers call the same Redis cluster. The `INCR` command is atomic, so there's no race condition. I use Redis Cluster with consistent hashing — all requests for the same user always hit the same Redis shard. At 1M req/sec with 2 Redis ops per request, I need 2M ops/sec total. A 10-node Redis cluster at 200K ops/node handles this comfortably.

The alternative is local counters with gossip — each server maintains local counts and syncs periodically. This is faster but less accurate. A user could exceed the limit by N×local_count where N is the number of servers before gossip catches up. For DDoS protection, accuracy matters, so I'd use central Redis."

**Interviewer:** "What happens when Redis goes down?"

**Candidate:** "Fail open. If the rate limiter can't reach Redis within 10 milliseconds, it allows the request through and logs the failure. The reasoning: failing closed — blocking all requests — is catastrophic for our users. Failing open during a Redis outage is a controlled risk. We have CDN-level rate limiting as a backstop for DDoS, and during a Redis outage the backend services have their own connection limits as a final defense. I'd alert on-call immediately and auto-scale Redis replicas."

**Interviewer:** "How do you handle rules — different limits for free vs. paid users?"

**Candidate:** "I'd store rules in PostgreSQL — one row per rule, with fields for resource path, subject type, tier, limit, and window. Rules are loaded into application memory at startup and refreshed every 60 seconds. In-memory lookup is nanoseconds — no network call on the critical path. When a request comes in, I match it against the rule tree: most specific rule wins. 'POST /v1/messages for user:free tier' beats 'POST /v1/messages for all tiers' which beats '* for all tiers.' I'd also support an admin dashboard for rule CRUD with validation — minimum limit is 1, changes are audit-logged and can be rolled back."

**Interviewer:** "One last question: a customer claims your rate limiter is blocking them incorrectly. How do you debug this?"

**Candidate:** "Three steps. First, I'd check the rate limit response headers they received — X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, and the matched_rule field. This tells us which rule triggered and how many requests we've counted. Second, I'd query our centralized request logs by their user ID and the time window in question — I'd see exactly which requests we received. Third, I'd inspect the Redis counter directly: `KEYS rl:*{user_id}*` and `GET` those keys to see the raw counts. If the counts are wrong, it suggests a bug in the sliding window calculation. If the counts are right, it means the customer genuinely exceeded the limit and we'd show them the evidence."

---

### Score Card

| Area | Grade | Notes |
|---|---|---|
| Requirements | A | Asked about IP vs user, internal vs external |
| Algorithm knowledge | A+ | Named all 5, explained sliding window counter correctly |
| Distributed design | A | Central Redis with cluster, explained trade-offs |
| Failure handling | A | Fail-open with CDN backstop |
| Debugging | A | Practical 3-step approach |
""",
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

print(f"Updated {len(CONTENT)} sessions for Rate Limiter")
