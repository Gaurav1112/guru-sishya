#!/usr/bin/env python3
"""Part 6: Web Crawler — all 10 sessions"""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if "Web Crawler" in d["topic"])
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## Session 1: Requirements & Scope

A web crawler is the foundation of search engines, SEO tools, price comparison sites, and web archives. It's also a rich source of systems design questions because it touches distributed computing, graph traversal, politeness constraints, and massive scale.

### Opening Questions

**Candidate:** "Before designing, I want to clarify: What's the primary purpose of this crawler — search engine indexing, data collection, or link analysis? How many pages do we need to crawl? How fresh does the content need to be? And what's the scope — the entire web, or a specific domain set?"

**Agreed scope:**
- Purpose: build a search engine index (like Google)
- Scale: 1 billion pages, crawl the entire web
- Freshness: re-crawl popular pages every few days, others every few weeks
- Languages: all, primarily English
- Politeness: respect robots.txt and crawl-delay directives

### Functional Requirements

1. **URL frontier management:** Maintain a queue of URLs to crawl, prioritized by importance and freshness
2. **Fetching:** Download page content (HTML) from URLs
3. **Parsing:** Extract links from fetched pages, add new URLs to frontier
4. **Deduplication:** Avoid crawling the same page twice (URL-level and content-level)
5. **Storage:** Store fetched page content for downstream indexing
6. **robots.txt compliance:** Respect crawl rules set by website owners
7. **Politeness:** Don't overwhelm any single server

### Non-Functional Requirements

| Requirement | Target |
|---|---|
| Throughput | 1 billion pages in 4 weeks |
| Freshness | Popular pages re-crawled within 24 hours |
| Politeness | Max 1 req/5 seconds per domain |
| Fault tolerance | Resume after server crash (no duplicate work) |
| Scalability | Add crawler instances to increase throughput |
| Storage | Petabytes of page content |

### Throughput Calculation (Preview)

```
Target: 1B pages in 28 days
Pages per second: 1B / (28 * 86,400) = 413 pages/sec
Average page size: 100KB
Bandwidth needed: 413 * 100KB = 41 MB/sec download
```

"This seems manageable, but the real challenge is coordination — ensuring 100+ crawlers don't fetch the same URL twice, don't hammer the same server, and recover gracefully from failures."
""",

2: """## Session 2: Capacity Estimation

### Throughput Requirements

```
Pages to crawl: 1 billion
Time window: 28 days (typical re-crawl cycle)
Time in seconds: 28 * 24 * 3600 = 2,419,200 seconds

Required throughput: 1B / 2,419,200 ≈ 413 pages/second
Peak (3x buffer): ~1,240 pages/second

To handle re-crawl (popular pages re-crawled 10x more often):
  20% of pages are "popular" and re-crawled 10x/month
  Effective load: 0.2 * 1B * 10/month + 0.8 * 1B * 1/month
  = 2B + 800M = 2.8B crawls/month
  = 2.8B / (30 * 86,400) = 1,080 pages/second average
  Peak: ~3,000 pages/second with 3x buffer
```

### Storage Requirements

```
Per page:
  URL:          500 bytes (average URL length)
  HTML content: 100 KB (average page size)
  Metadata:     1 KB (crawl timestamp, status, content hash)
  Total:        ~101.5 KB per page

For 1 billion pages:
  101.5 KB * 1B = 101.5 TB of raw data
  With 3x replication: ~300 TB
  After compression (HTML compresses ~10:1): ~10 TB raw

Crawl history (multiple crawl versions):
  Keep last 3 versions: 300 TB * 3 = 900 TB
  Use cheap object storage (S3): $900 TB * $0.023/GB = ~$21,000/month
```

### URL Frontier Size

```
URLs discovered (average web graph depth):
  Starting URLs: 1M seed URLs
  Each page has avg 30 links
  After deduplication: frontier grows to ~5 billion unique URLs
  Active frontier (next 7 days): ~200M URLs

Frontier storage:
  200M URLs * 500 bytes = 100 GB
  Fits in Redis with compression, or use disk-backed queue
```

### Bandwidth

```
Download: 3,000 pages/sec * 100 KB = 300 MB/sec = 2.4 Gbps
  Requires: 3 servers with 1Gbps each, or 1 server with 10Gbps

Upload (to S3): same rate ~300 MB/sec
DNS resolution: 3,000 domains/sec * 10ms = manageable with local DNS cache
```

### Crawler Fleet Sizing

```
Per crawler worker:
  Network I/O: 1 request at a time (politeness constraint)
  Time per page: 500ms download + 100ms parse = 600ms
  Pages per worker per second: 1.67

Workers needed: 3,000 / 1.67 = ~1,800 workers
  Run on 20 servers with 100 workers each (goroutines/asyncio tasks)
```

**Interview insight:** "The bottleneck isn't compute — it's I/O. Most crawlers are I/O bound (waiting for network). Using async I/O (Python asyncio or Go goroutines) lets one machine handle thousands of concurrent requests efficiently."
""",

3: """## Session 3: API Design

A web crawler has fewer external-facing APIs than other systems. Its APIs are mostly internal — between crawler components — and one admin interface.

### Internal Component APIs

**URL Frontier Service:**

```protobuf
service URLFrontier {
  rpc Submit(SubmitURLRequest) returns (SubmitURLResponse);
  rpc Fetch(FetchURLRequest) returns (URLBatch);
  rpc Acknowledge(AckRequest) returns (AckResponse);
}

message SubmitURLRequest {
  repeated string urls = 1;
  string source_url = 2;      // which page linked to these
  float priority = 3;          // 0.0-1.0 (higher = more important)
}

message FetchURLRequest {
  string worker_id = 1;        // for tracking
  int32 batch_size = 2;        // how many URLs to get
  string domain_filter = 3;    // optional: only urls from this domain
}

message URLBatch {
  repeated URLTask tasks = 1;
}

message URLTask {
  string url = 1;
  string task_id = 2;          // for acknowledgment
  int32 crawl_delay_ms = 3;    // respect this delay before fetching
  bytes robots_cache = 4;      // cached robots.txt for this domain
}

message AckRequest {
  string task_id = 1;
  string worker_id = 2;
  bool success = 3;
  int32 http_status = 4;
  string error = 5;            // if not success
}
```

**Content Storage Service:**

```python
# REST API for storing crawled content
POST /v1/pages
Content-Type: application/json

{
  "url": "https://example.com/page",
  "crawled_at": "2024-01-15T10:30:00Z",
  "http_status": 200,
  "content_type": "text/html",
  "content_hash": "sha256:abc123...",
  "content_length": 102400,
  "content_url": "s3://crawler-content/2024/01/15/abc123.html.gz",
  "extracted_links": [
    "https://example.com/other-page",
    "https://external.com/linked-page"
  ],
  "metadata": {
    "title": "Example Page",
    "language": "en",
    "robots_meta": "index,follow"
  }
}
```

**Admin API (HTTP REST):**

```http
# Add seed URLs to start a crawl
POST /admin/v1/seeds
{
  "urls": ["https://example.com/", "https://wikipedia.org/"],
  "priority": 0.9
}

# Get crawl stats
GET /admin/v1/stats
Response:
{
  "pages_crawled_today": 28400000,
  "pages_in_frontier": 198473022,
  "crawl_errors_24h": 1247,
  "frontier_health": "healthy",
  "worker_count": 1847,
  "bytes_downloaded_today": "2.84 TB"
}

# Pause/resume a domain
PUT /admin/v1/domains/{domain}/pause
PUT /admin/v1/domains/{domain}/resume

# Get robots.txt for a domain
GET /admin/v1/domains/{domain}/robots
```

### Crawler Worker Python Implementation

```python
import asyncio
import aiohttp
import hashlib
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

class CrawlerWorker:
    def __init__(self, worker_id: str, frontier_client, storage_client):
        self.worker_id = worker_id
        self.frontier = frontier_client
        self.storage = storage_client
        self.session = None

    async def run(self):
        self.session = aiohttp.ClientSession(
            headers={"User-Agent": "MyCrawler/1.0 (+https://mycrawler.com/bot.html)"},
            timeout=aiohttp.ClientTimeout(total=30)
        )
        async with self.session:
            while True:
                task = await self.frontier.get_task(self.worker_id)
                if not task:
                    await asyncio.sleep(1)
                    continue
                await self.process_task(task)

    async def process_task(self, task: URLTask):
        # Respect crawl delay
        await asyncio.sleep(task.crawl_delay_ms / 1000)

        url = task.url
        try:
            async with self.session.get(url) as response:
                if response.content_type != "text/html":
                    await self.frontier.acknowledge(task.task_id, success=False,
                                                    error="non-html content")
                    return

                html = await response.text(encoding="utf-8", errors="replace")
                content_hash = hashlib.sha256(html.encode()).hexdigest()

                # Check if content changed since last crawl
                if await self.storage.is_duplicate(content_hash):
                    await self.frontier.acknowledge(task.task_id, success=True)
                    return

                # Parse links
                links = self.extract_links(html, base_url=url)

                # Store content
                await self.storage.store_page({
                    "url": url,
                    "http_status": response.status,
                    "content_hash": content_hash,
                    "html": html,
                    "extracted_links": links,
                })

                # Submit discovered links to frontier
                await self.frontier.submit_urls(links, source_url=url)

                await self.frontier.acknowledge(task.task_id, success=True,
                                                http_status=response.status)

        except asyncio.TimeoutError:
            await self.frontier.acknowledge(task.task_id, success=False, error="timeout")
        except Exception as e:
            await self.frontier.acknowledge(task.task_id, success=False, error=str(e))

    def extract_links(self, html: str, base_url: str) -> list[str]:
        soup = BeautifulSoup(html, "html.parser")
        links = []
        for tag in soup.find_all("a", href=True):
            href = tag["href"].strip()
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            if parsed.scheme in ("http", "https") and parsed.netloc:
                links.append(full_url)
        return list(set(links))  # deduplicate
```
""",

4: """## Session 4: Database Schema

A web crawler uses multiple storage systems for different parts of its data.

### URL Frontier: Redis + PostgreSQL

```sql
-- PostgreSQL: URL metadata and crawl history
CREATE TABLE urls (
    id              BIGSERIAL PRIMARY KEY,
    url             TEXT NOT NULL,
    url_hash        VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 of normalized URL
    domain          VARCHAR(255) NOT NULL,
    first_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_crawled    TIMESTAMPTZ,
    next_crawl      TIMESTAMPTZ,                   -- scheduled recrawl time
    priority_score  FLOAT NOT NULL DEFAULT 0.5,
    crawl_status    VARCHAR(20) NOT NULL DEFAULT 'pending',
    http_status     INT,
    content_hash    VARCHAR(64),                   -- SHA-256 of content (for dedup)
    error_count     INT NOT NULL DEFAULT 0,
    page_rank       FLOAT                          -- computed from link graph
);

CREATE INDEX idx_urls_next_crawl ON urls(next_crawl, priority_score DESC)
    WHERE crawl_status IN ('pending', 'scheduled');
CREATE INDEX idx_urls_domain ON urls(domain);
CREATE UNIQUE INDEX idx_urls_hash ON urls(url_hash);

-- Domain crawl rules (politeness settings)
CREATE TABLE domains (
    id              BIGSERIAL PRIMARY KEY,
    domain          VARCHAR(255) NOT NULL UNIQUE,
    robots_txt      TEXT,
    robots_fetched  TIMESTAMPTZ,
    crawl_delay_ms  INT NOT NULL DEFAULT 1000,     -- min delay between requests
    is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,
    last_request_at TIMESTAMPTZ,
    requests_today  INT NOT NULL DEFAULT 0
);

-- Crawl jobs for tracking active work
CREATE TABLE crawl_jobs (
    id              BIGSERIAL PRIMARY KEY,
    url_id          BIGINT NOT NULL REFERENCES urls(id),
    worker_id       VARCHAR(100),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    completed_at    TIMESTAMPTZ,
    CONSTRAINT unique_active_job UNIQUE (url_id, status)
);
```

### Content Storage: Object Storage (S3)

```
S3 bucket: crawler-content-{region}
Key format: content/{year}/{month}/{day}/{content_hash}.html.gz
Metadata: {
  "url": "https://example.com/page",
  "crawled_at": "2024-01-15T10:30:00Z",
  "http_status": "200",
  "content_type": "text/html; charset=utf-8"
}

Storage class:
  Hot (< 30 days old): S3 Standard
  Warm (30-90 days): S3 Standard-IA
  Cold (> 90 days): S3 Glacier Instant Retrieval
```

### URL Deduplication: Bloom Filter + Hash Table

```python
import mmh3  # MurmurHash3
import bitarray

class BloomFilter:
    \"\"\"Space-efficient probabilistic set membership test.\"\"\"
    def __init__(self, capacity: int, false_positive_rate: float = 0.001):
        # Optimal parameters
        import math
        m = int(-capacity * math.log(false_positive_rate) / (math.log(2) ** 2))
        k = int(m / capacity * math.log(2))
        self.m = m
        self.k = k
        self.bits = bitarray.bitarray(m)
        self.bits.setall(0)

    def add(self, item: str) -> None:
        for seed in range(self.k):
            index = mmh3.hash(item, seed) % self.m
            self.bits[index] = 1

    def __contains__(self, item: str) -> bool:
        return all(
            self.bits[mmh3.hash(item, seed) % self.m]
            for seed in range(self.k)
        )

# For 1B URLs:
# m = 1B * -ln(0.001) / ln(2)^2 ≈ 14.4 billion bits = 1.8 GB
# k = 10 hash functions
# False positive rate: 0.1% (acceptable — some duplicate fetches)

url_seen = BloomFilter(capacity=2_000_000_000, false_positive_rate=0.001)
content_seen = BloomFilter(capacity=1_000_000_000, false_positive_rate=0.001)
```

### Redis for Active Frontier Queue

```python
# Priority queue using Redis Sorted Set
# Score = priority value (higher = fetched sooner)

# Add URL to frontier
await redis.zadd("frontier:queue", {url_hash: priority_score})

# Get next N URLs (highest priority first)
items = await redis.zpopmax("frontier:queue", count=batch_size)

# Per-domain rate limiting
domain_key = f"domain_last_fetch:{domain}"
last_fetch = await redis.get(domain_key)
if last_fetch:
    elapsed = time.time() - float(last_fetch)
    if elapsed < min_delay_seconds:
        # Re-queue with delay
        await redis.zadd("frontier:queue", {url_hash: time.time() + min_delay_seconds})
        return None
await redis.set(domain_key, time.time(), ex=3600)
```
""",

5: """## Session 5: High-Level Architecture

### System Overview

```mermaid
graph TB
    Seeds[Seed URLs<br/>Admin Input]

    subgraph Frontier ["URL Frontier Service"]
        PQ[Priority Queue<br/>Redis Sorted Set]
        Scheduler[Recrawl Scheduler]
        DomainMgr[Domain Manager<br/>robots.txt + rate limits]
    end

    subgraph Workers ["Crawler Worker Fleet (20 servers)"]
        W1[Worker 1<br/>1000 async tasks]
        W2[Worker 2<br/>1000 async tasks]
        WN[Worker N<br/>1000 async tasks]
    end

    subgraph Dedup ["Deduplication Layer"]
        BF[Bloom Filter<br/>URL dedup]
        ContentHash[Content Hash Store<br/>Redis]
    end

    subgraph Storage ["Content Storage"]
        S3[(S3<br/>HTML Content)]
        PG[(PostgreSQL<br/>URL Metadata)]
        Graph[(Neo4j / Cassandra<br/>Link Graph)]
    end

    subgraph Downstream ["Downstream Processing"]
        Parser[Content Parser<br/>Kafka Consumer]
        Indexer[Search Indexer]
        Ranker[PageRank Computer]
    end

    Seeds --> Frontier
    Frontier --> Workers
    Workers --> |fetch URL| Internet((The Web))
    Internet --> |HTML + Links| Workers
    Workers --> Dedup
    Dedup --> |new URL| Frontier
    Workers --> |page content| S3
    Workers --> |metadata| PG
    Workers --> |links| Graph
    S3 --> Kafka[Kafka<br/>crawled_pages topic]
    Kafka --> Parser --> Indexer
    Graph --> Ranker
    Ranker --> |update priorities| Frontier
```

### Crawl Flow (Single URL)

```mermaid
sequenceDiagram
    participant W as Worker
    participant F as Frontier
    participant DM as Domain Manager
    participant BF as Bloom Filter
    participant Net as Network (Web)
    participant S3
    participant K as Kafka

    W->>F: GetTask(worker_id)
    F->>F: Pick highest priority URL
    F->>DM: CheckDomainRules(domain)
    DM-->>F: {crawl_delay: 1000ms, robots: allow}
    F-->>W: {url, crawl_delay_ms: 1000, task_id}

    W->>W: sleep(crawl_delay_ms)
    W->>Net: GET https://example.com/page
    Net-->>W: 200 OK, HTML content

    W->>BF: seen(content_hash)?
    BF-->>W: false (new content)

    W->>W: extract_links(html)
    loop For each extracted link
        W->>BF: seen(url)?
        BF-->>W: false → submit to frontier
        W->>F: SubmitURL(link, priority)
    end

    W->>S3: store_content(html, metadata)
    W->>K: publish({url, s3_path, links, metadata})
    W->>F: Acknowledge(task_id, success=true)
```

### Politeness Architecture

Respecting crawl delay is non-trivial at scale. The challenge: multiple workers might want to fetch from the same domain simultaneously.

```python
class DomainRateLimiter:
    def __init__(self, redis):
        self.redis = redis

    async def acquire_domain_slot(self, domain: str, min_delay_ms: int) -> bool:
        \"\"\"
        Returns True if we can fetch from this domain now.
        Uses Redis distributed lock with TTL = crawl delay.
        \"\"\"
        lock_key = f"crawl_lock:{domain}"
        # NX = only set if not exists
        acquired = await self.redis.set(
            lock_key, "1",
            nx=True,
            px=min_delay_ms  # lock expires after delay
        )
        return acquired is not None

    async def wait_for_domain(self, domain: str, min_delay_ms: int):
        while not await self.acquire_domain_slot(domain, min_delay_ms):
            await asyncio.sleep(min_delay_ms / 1000 / 10)  # poll 10x per delay period
```

### robots.txt Handling

```python
import urllib.robotparser

class RobotsTxtCache:
    def __init__(self, redis, max_age: int = 86400):  # cache for 24 hours
        self.redis = redis
        self.max_age = max_age

    async def get_parser(self, domain: str) -> urllib.robotparser.RobotFileParser:
        cache_key = f"robots:{domain}"
        cached = await self.redis.get(cache_key)

        if cached:
            rp = urllib.robotparser.RobotFileParser()
            rp.parse(cached.decode().splitlines())
            return rp

        # Fetch robots.txt
        robots_url = f"https://{domain}/robots.txt"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(robots_url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        text = await resp.text()
                    else:
                        text = ""  # No robots.txt = everything allowed
        except Exception:
            text = ""

        await self.redis.setex(cache_key, self.max_age, text)

        rp = urllib.robotparser.RobotFileParser()
        rp.parse(text.splitlines())
        return rp

    async def can_fetch(self, domain: str, url: str, user_agent: str = "*") -> bool:
        rp = await self.get_parser(domain)
        return rp.can_fetch(user_agent, url)

    async def get_crawl_delay(self, domain: str, user_agent: str = "*") -> float:
        rp = await self.get_parser(domain)
        delay = rp.crawl_delay(user_agent)
        return delay or 1.0  # default 1 second if not specified
```
""",

6: """## Session 6: Deep Dive — URL Frontier & Prioritization

The URL frontier is the heart of the crawler. It determines: which URL is crawled next, how often, and in what order.

### Priority Calculation

Not all pages are equally important. We want to crawl important pages first and re-crawl them more frequently.

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
import math

@dataclass
class URLPriority:
    url: str
    base_score: float    # 0.0-1.0
    recency_boost: float # boost if not crawled recently
    page_rank: float     # Google's PageRank (0.0-1.0)

def compute_priority(url_meta: dict) -> float:
    \"\"\"Compute crawl priority for a URL.\"\"\"
    page_rank = url_meta.get("page_rank", 0.1)

    # Recency: how stale is the content?
    last_crawled = url_meta.get("last_crawled")
    if last_crawled is None:
        recency_score = 1.0  # Never crawled → top priority
    else:
        hours_since_crawl = (datetime.utcnow() - last_crawled).total_seconds() / 3600
        # Priority decays then recovers: 0 at crawl time, 1.0 after target interval
        target_interval_hours = 24 if page_rank > 0.8 else 7 * 24  # 24h for popular, 7d for others
        recency_score = min(1.0, hours_since_crawl / target_interval_hours)

    # URL depth penalty: deep pages tend to be less important
    depth = url_meta.get("depth", 0)
    depth_penalty = 1.0 / (1.0 + 0.1 * depth)

    # Combine: page rank + recency + depth
    priority = (0.4 * page_rank + 0.4 * recency_score + 0.2 * depth_penalty)
    return priority

# Examples:
# Wikipedia main page (PR=1.0, last crawled 24h ago): priority ≈ 0.8
# New link discovered (never crawled): priority ≈ 0.7 (recency=1.0)
# Deep page (depth=10, PR=0.1): priority ≈ 0.2
```

### Frontier Architecture: Multi-Level Queue

```python
class MultiLevelFrontier:
    \"\"\"
    Three-level priority queue:
    - High: Popular pages, last crawled > 24h ago
    - Medium: Normal pages, last crawled > 7 days ago
    - Low: New URLs, deep pages, never crawled
    \"\"\"
    QUEUES = ["high", "medium", "low"]
    PROBABILITIES = [0.6, 0.3, 0.1]  # Weighted selection

    def __init__(self, redis):
        self.redis = redis

    async def enqueue(self, url: str, priority: float):
        if priority > 0.7:
            queue = "high"
        elif priority > 0.4:
            queue = "medium"
        else:
            queue = "low"
        key = f"frontier:{queue}"
        await self.redis.zadd(key, {url: priority})

    async def dequeue(self) -> str | None:
        \"\"\"Select queue using weighted random, pop highest priority from that queue.\"\"\"
        import random
        queue = random.choices(self.QUEUES, weights=self.PROBABILITIES)[0]
        key = f"frontier:{queue}"
        items = await self.redis.zpopmax(key, count=1)
        if items:
            return items[0][0].decode()
        # Fallback: try other queues
        for other_queue in self.QUEUES:
            if other_queue == queue:
                continue
            items = await self.redis.zpopmax(f"frontier:{other_queue}", count=1)
            if items:
                return items[0][0].decode()
        return None
```

### Politeness: Domain-Partitioned Queue

**Problem:** Multiple workers pick URLs from the same domain → violates crawl delay.

**Solution:** Each worker is "assigned" a set of domains. Only that worker fetches from those domains.

```python
class DomainPartitionedFrontier:
    def __init__(self, redis, worker_id: str, all_worker_ids: list[str]):
        self.redis = redis
        self.worker_id = worker_id
        self.worker_idx = all_worker_ids.index(worker_id)
        self.num_workers = len(all_worker_ids)

    def _worker_owns_domain(self, domain: str) -> bool:
        \"\"\"Consistent hashing: domain assigned to worker based on hash.\"\"\"
        domain_hash = hash(domain) & 0xFFFFFFFF  # 32-bit unsigned
        assigned_worker = domain_hash % self.num_workers
        return assigned_worker == self.worker_idx

    async def get_next_url(self) -> str | None:
        \"\"\"Get next URL from a domain this worker owns.\"\"\"
        # Scan frontier for URLs whose domain maps to this worker
        # In practice: maintain per-domain queues and worker→domain mapping
        domain_queue_key = f"worker:{self.worker_id}:domains"
        domains = await self.redis.smembers(domain_queue_key)

        for domain in domains:
            url = await self._get_from_domain(domain.decode())
            if url:
                return url
        return None
```

### Recrawl Scheduling

```python
class RecrawlScheduler:
    async def schedule_recrawl(self, url: str, page_rank: float, last_crawled: datetime):
        \"\"\"Determine when to re-crawl a URL based on its importance.\"\"\"
        if page_rank > 0.8:
            # Very popular pages: re-crawl every 24 hours
            interval = timedelta(hours=24)
        elif page_rank > 0.5:
            # Moderately popular: every 3 days
            interval = timedelta(days=3)
        elif page_rank > 0.2:
            # Normal pages: weekly
            interval = timedelta(days=7)
        else:
            # Low-value pages: monthly
            interval = timedelta(days=30)

        next_crawl = last_crawled + interval
        priority = compute_priority({"page_rank": page_rank, "last_crawled": last_crawled})

        await db.execute(
            "UPDATE urls SET next_crawl = $1, priority_score = $2 WHERE url_hash = $3",
            next_crawl, priority, hash_url(url)
        )
        await frontier.enqueue(url, priority)

    async def run_scheduler_loop(self):
        \"\"\"Background task: move due URLs into active frontier.\"\"\"
        while True:
            # Find URLs due for recrawl
            due_urls = await db.fetch(
                \"\"\"SELECT url, priority_score FROM urls
                   WHERE next_crawl <= NOW()
                   AND crawl_status != 'in_progress'
                   ORDER BY priority_score DESC
                   LIMIT 10000\"\"\")

            for url in due_urls:
                await frontier.enqueue(url["url"], url["priority_score"])
                await db.execute(
                    "UPDATE urls SET crawl_status = 'scheduled' WHERE url = $1",
                    url["url"]
                )

            await asyncio.sleep(60)  # Check every minute
```
""",

7: """## Session 7: Deep Dive — Deduplication, Link Graph & PageRank

### URL Normalization (Before Dedup)

Two URLs can refer to the same resource:
- `http://example.com/page` vs `https://example.com/page`
- `https://example.com/page?utm_source=twitter&utm_campaign=x` vs `https://example.com/page`
- `https://example.com/page/` vs `https://example.com/page`

```python
from urllib.parse import urlparse, urlencode, parse_qsl, urlunparse
import re

# URL parameters that don't affect content (tracking parameters)
STRIP_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "ref", "source", "click_id"
}

def normalize_url(url: str) -> str:
    \"\"\"Normalize URL for deduplication.\"\"\"
    parsed = urlparse(url.strip())

    # 1. Lowercase scheme and host
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()

    # 2. Normalize path (remove trailing slash, decode %XX)
    path = parsed.path.rstrip("/") or "/"

    # 3. Remove tracking parameters, sort remaining
    params = parse_qsl(parsed.query)
    filtered_params = [(k, v) for k, v in params if k.lower() not in STRIP_PARAMS]
    filtered_params.sort()  # canonical order
    query = urlencode(filtered_params)

    # 4. Remove fragment (anchors don't affect server-side content)
    fragment = ""

    # 5. Normalize www prefix (optional — depends on policy)
    if netloc.startswith("www."):
        netloc = netloc[4:]

    normalized = urlunparse((scheme, netloc, path, "", query, fragment))
    return normalized

# Examples:
# normalize_url("https://WWW.Example.COM/Page/?utm_source=twitter#section")
# → "https://example.com/Page"

# normalize_url("http://example.com/page?b=2&a=1")
# → "http://example.com/page?a=1&b=2"
```

### Content-Level Deduplication (Simhash)

URLs can differ but content be identical (e.g., syndicated articles). Use Simhash:

```python
import re
import hashlib
from collections import Counter

def simhash(text: str, bits: int = 64) -> int:
    \"\"\"
    Compute SimHash of text.
    Similar documents have similar (close) SimHash values.
    \"\"\"
    # Tokenize: 3-grams of words
    words = re.findall(r'\\w+', text.lower())
    tokens = [" ".join(words[i:i+3]) for i in range(len(words)-2)]

    if not tokens:
        return 0

    # Count token frequencies
    freqs = Counter(tokens)

    # For each bit position, accumulate weighted sum
    v = [0] * bits
    for token, freq in freqs.items():
        token_hash = int(hashlib.md5(token.encode()).hexdigest(), 16)
        for i in range(bits):
            bit = (token_hash >> i) & 1
            v[i] += freq if bit else -freq

    # Fingerprint: bit[i] = 1 if v[i] > 0
    fingerprint = 0
    for i in range(bits):
        if v[i] > 0:
            fingerprint |= (1 << i)
    return fingerprint

def hamming_distance(h1: int, h2: int, bits: int = 64) -> int:
    \"\"\"Count differing bits (lower = more similar).\"\"\"
    xor = h1 ^ h2
    return bin(xor).count('1')

def is_near_duplicate(h1: int, h2: int, threshold: int = 3) -> bool:
    \"\"\"Two documents are near-duplicates if they differ in <= 3 bits.\"\"\"
    return hamming_distance(h1, h2) <= threshold
```

### Link Graph & PageRank

```python
# Storing the link graph in Cassandra (web graph is huge)
# Table: which URLs does this page link to?
CREATE TABLE outlinks (
    source_url_hash  VARCHAR(64),
    target_url_hash  VARCHAR(64),
    anchor_text      TEXT,
    discovered_at    TIMESTAMP,
    PRIMARY KEY (source_url_hash, target_url_hash)
);

# Table: which URLs link to this page? (for PageRank computation)
CREATE TABLE inlinks (
    target_url_hash  VARCHAR(64),
    source_url_hash  VARCHAR(64),
    PRIMARY KEY (target_url_hash, source_url_hash)
);
```

### Simplified PageRank Computation

```python
async def compute_pagerank_iteration(urls: list[str], damping: float = 0.85) -> dict[str, float]:
    \"\"\"
    One iteration of the PageRank algorithm.
    PR(A) = (1-d) + d * SUM(PR(Bi) / OutLinks(Bi)) for all Bi linking to A
    \"\"\"
    new_ranks = {}
    for url in urls:
        url_hash = hashlib.sha256(url.encode()).hexdigest()

        # Get all inbound links
        inlinks = await cassandra.execute(
            "SELECT source_url_hash FROM inlinks WHERE target_url_hash = %s",
            [url_hash]
        )

        rank_sum = 0.0
        for inlink in inlinks:
            source_hash = inlink.source_url_hash
            source_pr = current_ranks.get(source_hash, 0.0)

            # How many outbound links does the source have?
            outlink_count = await cassandra.execute(
                "SELECT COUNT(*) FROM outlinks WHERE source_url_hash = %s",
                [source_hash]
            )
            count = outlink_count[0].count

            if count > 0:
                rank_sum += source_pr / count

        new_ranks[url_hash] = (1 - damping) + damping * rank_sum

    return new_ranks

# In practice: use Apache Spark for distributed PageRank computation
# Spark GraphX can compute PageRank on a billion-node graph in hours
```

### Handling Traps

**Spider traps:** Sites that generate infinite URLs (e.g., calendar apps generating `/2024/01/01/`, `/2024/01/02/`, etc.)

```python
def detect_spider_trap(url: str, crawl_history: list[str]) -> bool:
    parsed = urlparse(url)
    path_parts = parsed.path.split("/")

    # Heuristic 1: URL depth > 10 → likely trap
    if len(path_parts) > 10:
        return True

    # Heuristic 2: Repeated path segments
    if len(path_parts) != len(set(path_parts)):
        return True

    # Heuristic 3: Same domain, 1000+ pages → maybe trap
    domain = parsed.netloc
    domain_count = sum(1 for u in crawl_history if domain in u)
    if domain_count > 1000:
        return True

    # Heuristic 4: URL contains session IDs or random tokens
    if re.search(r'[a-f0-9]{32}|sessionid|PHPSESSID', url):
        return True

    return False
```
""",

8: """## Session 8: Scaling & Fault Tolerance

### Horizontal Scaling of Crawlers

```mermaid
graph LR
    Coord[Coordinator<br/>ZooKeeper] --> |assigns domains| W1[Worker 1<br/>domains A-E]
    Coord --> |assigns domains| W2[Worker 2<br/>domains F-M]
    Coord --> |assigns domains| WN[Worker N<br/>domains N-Z]

    W1 & W2 & WN --> Frontier[URL Frontier<br/>Redis Cluster]
    W1 & W2 & WN --> S3[(S3 Content Store)]
    W1 & W2 & WN --> PG[(PostgreSQL Metadata)]
```

Adding a new worker:
1. Worker registers with ZooKeeper
2. ZooKeeper re-distributes domain assignments (consistent hashing)
3. Domains migrated: un-assign from old workers, assign to new worker
4. In-flight jobs for migrated domains: timeout → re-queued

### Fault Tolerance: Checkpointing

**Problem:** Worker crashes mid-crawl. Which URLs were successfully stored? Which need to be retried?

```python
class CheckpointedCrawler:
    async def process_url(self, task: URLTask):
        url = task.url
        task_id = task.task_id

        # Checkpoint state: URL is "in progress"
        await db.execute(
            \"\"\"INSERT INTO crawl_jobs (url_id, task_id, worker_id, status)
               VALUES ($1, $2, $3, 'in_progress')
               ON CONFLICT (task_id) DO NOTHING\"\"\",
            task.url_id, task_id, self.worker_id
        )

        try:
            content = await self.fetch(url)
            links = await self.parse(content)
            await self.store(url, content)

            # Checkpoint: success
            await db.execute(
                "UPDATE crawl_jobs SET status = 'done', completed_at = NOW() WHERE task_id = $1",
                task_id
            )
            await self.frontier.acknowledge(task_id, success=True)

        except Exception as e:
            # Checkpoint: failure
            await db.execute(
                "UPDATE crawl_jobs SET status = 'failed', error = $2 WHERE task_id = $1",
                task_id, str(e)
            )
            await self.frontier.acknowledge(task_id, success=False, error=str(e))

# Recovery: on restart, find all 'in_progress' jobs > 60s old
async def recover_stale_jobs():
    stale = await db.fetch(
        \"\"\"SELECT task_id, url FROM crawl_jobs
           WHERE status = 'in_progress'
           AND assigned_at < NOW() - INTERVAL '60 seconds'\"\"\")

    for job in stale:
        # Re-queue the URL
        await frontier.submit_url(job["url"], priority=0.8)  # higher priority for retry
        await db.execute(
            "UPDATE crawl_jobs SET status = 'requeued' WHERE task_id = $1",
            job["task_id"]
        )
```

### Distributed URL Deduplication at Scale

The Bloom filter (Session 4) works for single-machine dedup. For distributed crawlers:

```python
class DistributedBloomFilter:
    \"\"\"Bloom filter stored in Redis Cluster.\"\"\"
    def __init__(self, redis_cluster, num_bits: int = 14_400_000_000):
        self.redis = redis_cluster
        self.num_bits = num_bits
        self.num_hashes = 10
        # Redis BITFIELD: store 14.4B bits = 1.8 GB in Redis

    def _get_bit_positions(self, url: str) -> list[int]:
        positions = []
        for seed in range(self.num_hashes):
            idx = mmh3.hash128(url, seed) % self.num_bits
            positions.append(idx)
        return positions

    async def check_and_add(self, url: str) -> bool:
        \"\"\"Returns True if URL was NEW (not seen before). Adds it atomically.\"\"\"
        positions = self._get_bit_positions(url)

        # Use Lua script for atomic check-and-set
        lua_script = \"\"\"
            local seen = true
            for _, pos in ipairs(KEYS) do
                if redis.call('GETBIT', 'bloom:urls', pos) == 0 then
                    seen = false
                end
            end
            if not seen then
                for _, pos in ipairs(KEYS) do
                    redis.call('SETBIT', 'bloom:urls', pos, 1)
                end
            end
            return seen and 0 or 1  -- 1=new, 0=already seen
        \"\"\"
        result = await self.redis.eval(lua_script, keys=[str(p) for p in positions])
        return result == 1  # True if new
```

### Crawl Rate Monitoring & Auto-Scaling

```python
class CrawlRateMonitor:
    async def get_metrics(self) -> dict:
        return {
            "pages_per_second": await self._measure_rate("pages_crawled"),
            "frontier_size": await redis.zcard("frontier:high") +
                            await redis.zcard("frontier:medium") +
                            await redis.zcard("frontier:low"),
            "error_rate": await self._measure_rate("crawl_errors") /
                         max(1, await self._measure_rate("crawl_attempts")),
            "worker_count": len(await zookeeper.get_workers()),
            "average_fetch_time_ms": await self._measure_avg("fetch_time"),
        }

    async def auto_scale(self):
        metrics = await self.get_metrics()
        target_rate = 3000  # pages/second

        if metrics["pages_per_second"] < target_rate * 0.8:
            # Behind target: add workers
            await kubernetes.scale_deployment("crawler-workers",
                                              replicas=metrics["worker_count"] + 5)
        elif metrics["pages_per_second"] > target_rate * 1.2:
            # Ahead of target or over-crawling: reduce workers
            await kubernetes.scale_deployment("crawler-workers",
                                              replicas=max(5, metrics["worker_count"] - 2))
```
""",

9: """## Session 9: Edge Cases & Failure Modes

### Edge Case 1: Infinite Redirect Chains

```
http://a.com/page → http://b.com/other → http://a.com/page (cycle!)
```

```python
async def fetch_with_redirect_tracking(url: str, max_redirects: int = 5) -> Response:
    visited_urls = set()
    current_url = url

    for _ in range(max_redirects):
        if current_url in visited_urls:
            raise CyclicRedirectError(f"Redirect cycle detected at {current_url}")
        visited_urls.add(current_url)

        response = await http.get(current_url, allow_redirects=False)
        if response.status in (301, 302, 303, 307, 308):
            location = response.headers.get("Location")
            if not location:
                raise InvalidRedirectError("Redirect without Location header")
            current_url = urljoin(current_url, location)  # handle relative redirects
        else:
            return response

    raise TooManyRedirectsError(f"Exceeded {max_redirects} redirects")
```

### Edge Case 2: Huge Pages (Memory Bomb)

A page with 100MB of content could exhaust worker memory.

```python
async def fetch_with_size_limit(url: str, max_bytes: int = 5_242_880) -> bytes | None:
    \"\"\"Download page, abort if larger than 5MB.\"\"\"
    try:
        async with session.get(url) as response:
            # Check Content-Length header first
            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > max_bytes:
                return None  # Skip oversized page

            # Stream download with size check
            chunks = []
            total = 0
            async for chunk in response.content.iter_chunked(65536):
                total += len(chunk)
                if total > max_bytes:
                    return None  # Exceeded limit mid-download
                chunks.append(chunk)

            return b"".join(chunks)
    except Exception:
        return None
```

### Edge Case 3: Dynamic JavaScript Pages

Sites like SPAs (Single Page Applications) return empty HTML without JavaScript execution. The actual content is loaded by JavaScript.

**Detection:**

```python
def is_javascript_heavy(html: str) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    # Very few links + JavaScript frameworks present
    link_count = len(soup.find_all("a"))
    has_react = bool(soup.find(id="root")) or bool(soup.find(id="app"))
    has_vue = bool(soup.find(id="vue-app"))
    return link_count < 5 and (has_react or has_vue)

# For JS-heavy pages: use Playwright/Puppeteer (headless browser)
# Much more expensive: ~10x slower, ~5x more memory
# Separate worker pool for JS-heavy sites
```

### Edge Case 4: Trap Detection — Calendar Infinite Loop

```
Site generates: /calendar/2024/01/01, /calendar/2024/01/02, ..., /calendar/2099/12/31
That's 27,394 days × 24 hours × 60 minutes = billions of pages!
```

```python
class PerDomainCrawlLimiter:
    def __init__(self, redis, max_pages_per_domain: int = 100_000):
        self.redis = redis
        self.max_pages = max_pages_per_domain

    async def can_crawl(self, url: str) -> bool:
        domain = urlparse(url).netloc
        count_key = f"domain_crawl_count:{domain}"
        count = await self.redis.incr(count_key)
        if count == 1:
            await self.redis.expire(count_key, 86400 * 7)  # 7-day window
        if count > self.max_pages:
            # Soft block: log and skip
            logger.warning(f"Domain {domain} exceeded crawl limit: {count} pages")
            return False
        return True
```

### Failure Mode 1: Network Partition

If workers can't reach the URL frontier:

```python
class OfflineCrawler:
    def __init__(self):
        self.local_queue = asyncio.Queue(maxsize=10000)
        self.frontier_available = True

    async def run(self):
        while True:
            if self.frontier_available:
                try:
                    task = await asyncio.wait_for(
                        self.frontier.get_task(timeout=5), timeout=10)
                    await self.local_queue.put(task)
                except Exception:
                    self.frontier_available = False
                    logger.warning("Frontier unavailable — using local queue")
            else:
                # Try to reconnect
                if await self.try_reconnect():
                    self.frontier_available = True

            # Process from local queue
            if not self.local_queue.empty():
                task = self.local_queue.get_nowait()
                await self.process_task(task)
```

### Failure Mode 2: Poison URLs

Some URLs cause the crawler to hang indefinitely (e.g., servers that accept connections but never respond).

```python
async def fetch_with_timeout(url: str, timeout: float = 30.0) -> Response | None:
    try:
        # Connect timeout: 10s, Read timeout: 20s
        timeout = aiohttp.ClientTimeout(connect=10, sock_read=20, total=timeout)
        async with session.get(url, timeout=timeout) as response:
            return await response.read()
    except asyncio.TimeoutError:
        logger.debug(f"Timeout fetching {url}")
        # Blacklist domain temporarily if too many timeouts
        await increment_domain_error_count(urlparse(url).netloc)
        return None
    except aiohttp.ClientError as e:
        logger.debug(f"HTTP error for {url}: {e}")
        return None
```

### Failure Mode 3: S3 Write Failure

If content storage fails, we shouldn't lose the crawl result.

```python
async def store_with_retry(url: str, content: bytes, max_retries: int = 3):
    content_hash = hashlib.sha256(content).hexdigest()
    s3_key = f"content/{datetime.utcnow().strftime('%Y/%m/%d')}/{content_hash}.html.gz"

    for attempt in range(max_retries):
        try:
            compressed = gzip.compress(content)
            await s3.put_object(
                Bucket="crawler-content",
                Key=s3_key,
                Body=compressed,
                ContentEncoding="gzip",
                ContentType="text/html",
                Metadata={"url": url, "crawled_at": datetime.utcnow().isoformat()}
            )
            return s3_key
        except Exception as e:
            if attempt == max_retries - 1:
                # Last resort: store to local disk, sync later
                local_path = f"/tmp/crawler_fallback/{content_hash}.html.gz"
                with gzip.open(local_path, "wb") as f:
                    f.write(content)
                await queue_for_s3_sync(local_path, s3_key)
                return local_path
            await asyncio.sleep(2 ** attempt)
```
""",

10: """## Session 10: Mock Interview — Web Crawler

**Interviewer:** "Design a web crawler."

**Candidate:** "This is a broad topic. Let me clarify scope: Is this for a search engine index — crawling the whole web — or something more targeted like crawling a specific domain or set of domains? And what's the freshness requirement — how often should pages be re-crawled?"

**Interviewer:** "Search engine scale — the entire web. Popular pages should be re-crawled within 24 hours, others weekly."

**Candidate:** "Got it. At web scale — roughly 50 billion indexed pages — and a 28-day crawl cycle, we need about 1,200 pages per second of throughput. Let me walk through the architecture."

*[Draws system diagram]*

**Candidate:** "The system has five main components. First: the URL frontier — a priority queue of URLs to crawl, backed by Redis sorted sets. Second: crawler workers — async Python or Go processes that fetch and parse pages. Third: a deduplication layer — Bloom filters for URL deduplication and SimHash for near-duplicate content detection. Fourth: content storage — S3 for the HTML, PostgreSQL for URL metadata and crawl status. Fifth: a link graph store in Cassandra, used for PageRank computation which feeds back into crawl priority."

**Interviewer:** "How do you prioritize which URLs to crawl first?"

**Candidate:** "Three factors. First: PageRank — pages with many inbound links are more important. Second: freshness — how long since the last crawl, relative to the target recrawl interval. Third: URL depth — shallow pages tend to be more important than deeply nested ones. I'd compute a priority score as a weighted combination and use Redis sorted sets as a multi-level priority queue. High-priority queue gets 60% of crawler attention, medium gets 30%, low gets 10%. This ensures important pages are re-crawled frequently while new links are still discovered."

**Interviewer:** "How do you avoid crawling the same URL twice?"

**Candidate:** "Two layers: URL normalization and Bloom filter deduplication. URL normalization first — strip tracking parameters like utm_source, lowercase the domain, remove trailing slashes, sort query parameters. This turns ten variations of the same URL into one canonical form. Then I hash the canonical URL with SHA-256 and check a Bloom filter. For 10 billion URLs with 0.1% false positive rate, the Bloom filter needs about 18 GB of memory. A 0.1% false positive rate means we skip re-crawling 1 in 1,000 genuinely new URLs — totally acceptable. In Redis, I'd store this as a BITFIELD command over a 14.4 billion bit array, about 1.8 GB per Redis node — achievable."

**Interviewer:** "How do you respect robots.txt?"

**Candidate:** "Each domain has a robots.txt at their root that specifies crawl rules. I'd fetch robots.txt once per domain per 24 hours and cache it in Redis. Before crawling any URL, I check the cached robots.txt for the domain. The Python `urllib.robotparser` library handles parsing. I also respect the Crawl-delay directive — if a site says 'Crawl-delay: 5', I wait at least 5 seconds between requests to that domain. I enforce this with a Redis distributed lock per domain: set a key with TTL = crawl delay, only one worker can acquire it at a time."

**Interviewer:** "What about politeness more generally — how do you avoid hammering a single server?"

**Candidate:** "Domain-based rate limiting. I maintain a Redis key `crawl_lock:{domain}` that expires after the minimum crawl delay. Workers check and set this atomically using Redis SET with NX and PX flags. If the lock is held, the URL goes back into the queue with a delayed score. I'd also assign domains to specific workers using consistent hashing — domain X always goes to worker Y. This avoids multiple workers trying to crawl the same domain simultaneously."

**Interviewer:** "What happens if a crawler worker crashes mid-crawl?"

**Candidate:** "Before processing a URL, the worker writes an `in_progress` entry to a PostgreSQL crawl_jobs table. If the worker crashes, this entry becomes stale. A background recovery job scans for in_progress jobs older than 60 seconds and re-queues them. The re-queued URLs get slightly higher priority so they're crawled soon. Because we write content to S3 before acknowledging completion, and we use idempotent S3 writes keyed by content hash, re-crawling a URL that was partially processed just overwrites the same S3 key — safe."

**Interviewer:** "How would you handle sites that dynamically generate infinite URLs — like a calendar generating a URL for every minute of every day?"

**Candidate:** "Spider traps. I use several heuristics to detect them. URL depth greater than 10 path components. Repeated path segments in a URL. More than 1,000 pages crawled from a single domain in a week — triggers a soft cap. URLs containing patterns that look like session IDs or timestamps — regex for 32-character hex strings or Unix timestamps in URLs. When a trap is detected, I blacklist the URL pattern with a `BLOCK` status in the domain table and alert an operator for manual review. The key insight is that legitimate content sites rarely need more than 100,000 pages, so a per-domain limit of 100,000 cuts off traps while still fully indexing most legitimate sites."

**Interviewer:** "How does this scale from 1,200 pages/second to 10,000 pages/second?"

**Candidate:** "The crawler workers are stateless and horizontally scalable. I'd add more worker instances — each handles 1,000 async tasks. The URL frontier is Redis Cluster — I'd add more Redis shards. The bottleneck at 10x scale would likely be the URL deduplication Bloom filter — at 100 billion URLs it needs 180 GB, too large for a single Redis node. I'd split it into a partitioned Bloom filter across 10 nodes, using consistent hashing on the URL hash to route to the correct node. The PostgreSQL metadata store might need sharding by URL hash at that scale. Content storage in S3 is already infinitely scalable. The link graph in Cassandra scales by adding nodes. The main operational challenge at 10x is managing the fleet of 15,000+ worker tasks — that's where Kubernetes auto-scaling and ZooKeeper-based coordination become essential."

---

### Key Differentiators in This Answer

- Quantified the scale upfront (1,200 pages/sec from first principles)
- Explained Bloom filter sizing with specific numbers
- Distinguished URL dedup from content dedup (SimHash)
- Gave specific implementation for robot.txt and politeness
- Named the spider trap heuristics concretely
- Traced fault recovery step by step
""",
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

print(f"Updated {len(CONTENT)} sessions for Web Crawler")
