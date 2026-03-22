#!/usr/bin/env python3
"""Part 4: News Feed (Facebook/Twitter) — all 10 sessions"""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if "News Feed" in d["topic"])
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## Session 1: Requirements & Scope

The news feed is the central product feature of Facebook, Twitter, and LinkedIn. It is also one of the most nuanced system design problems because the core challenge — fan-out — has no perfect solution.

### Clarifying Questions

**Candidate:** "Before designing, I want to clarify: Are we building a feed like Facebook (follow friends, bidirectional) or Twitter (follow anyone, unidirectional)? How many posts per day? Do we need to rank/recommend posts or is it chronological? And what's our user scale?"

**Agreed scope:**
- Unidirectional follows (like Twitter): anyone can follow anyone
- A user's feed = posts from everyone they follow
- Chronological ordering (no ML ranking for this interview)
- Text posts only (mention media as extension)
- Users can like and comment (mention, but don't design in detail)

### Functional Requirements

1. **Post:** User creates a post (text, up to 280 characters)
2. **Follow:** User follows another user
3. **Feed:** User sees a feed of posts from followed users, ordered by recency
4. **Like:** User likes a post (count shown)
5. **Notifications:** User notified when someone follows them or likes their post

**Out of scope:** Media uploads, search, trending topics, ML ranking, ads.

### Non-Functional Requirements

| Requirement | Target |
|---|---|
| Feed load latency | < 200ms P99 |
| Post publication delay | < 5 seconds (fan-out completes) |
| Availability | 99.99% |
| Eventual consistency | Feed updates within 10 seconds |
| Scale | 500M DAU, 10M posts/day |

### The Core Challenge: Fan-Out

**Candidate:** "The hardest part of a news feed is fan-out. When a user with 10M followers posts, their post needs to appear in 10M people's feeds. There are three strategies:

1. **Fan-out on write (push):** When post is created, immediately write to each follower's feed cache. Fast reads, expensive writes for celebrities.
2. **Fan-out on read (pull):** When user opens feed, query all their followees' posts in real time. No write overhead, slow reads for users with many followings.
3. **Hybrid:** Push for normal users, pull for celebrities.

This is the central design decision I'll need to justify."
""",

2: """## Session 2: Capacity Estimation

### Post Traffic

```
DAU: 500M
Posts per DAU: 10M/day total → avg 0.02 posts/user/day
Posts per second: 10M / 86,400 ≈ 116 posts/sec (peak: ~350/sec)

Post metadata:
  post_id:     8 bytes
  user_id:     8 bytes
  content:     280 bytes (Twitter-style)
  created_at:  8 bytes
  like_count:  8 bytes
  ──────────────────
  Total:       ~320 bytes/post

Storage per year:
  10M posts/day * 365 * 320B = 1.17 TB/year
  (very manageable — posts are tiny)
```

### Feed Generation Estimates

```
Fan-out on write calculation:
  10M posts/day at avg 500 followers each = 5 billion feed entries/day
  Peak: 350 posts/sec * 500 followers = 175,000 feed writes/sec

Celebrity fan-out (worst case):
  Cristiano Ronaldo (500M followers) posts once:
  500M feed entries to write → would take hours at 175K writes/sec
  This is why we need hybrid fan-out.

Feed reads:
  500M DAU * 10 feed loads/day = 5B feed reads/day
  5B / 86,400 = 57,800 reads/sec (peak: ~175,000/sec)
```

### Cache Sizing

```
Feed cache per user:
  Store last 1000 posts in user's feed cache
  Each entry: post_id (8 bytes) = 8 bytes (store IDs, not content)
  Per user: 1000 * 8 = 8KB

Active users in cache (20% of DAU):
  100M users * 8KB = 800 GB

Redis memory: ~1 TB (with overhead)
  Manageable with Redis Cluster
```

### Follower Graph

```
Edges in follow graph:
  500M users * avg 500 follows each = 250B edges
  Storage: 250B * 16 bytes (follower+followee IDs) = 4TB

This fits in a graph database or wide-column store (Cassandra).
```
""",

3: """## Session 3: API Design

### Post Creation

```http
POST /v1/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Just shipped a new feature! Check it out at...",
  "visibility": "public"  // "public", "followers_only", "private"
}
```

Response:
```json
{
  "post_id": "post_abc123",
  "user_id": "user_456",
  "content": "Just shipped a new feature!...",
  "created_at": "2024-01-15T10:30:00Z",
  "like_count": 0,
  "comment_count": 0,
  "is_liked": false
}
```

### Feed Retrieval

```http
GET /v1/feed?cursor=post_xyz&limit=20
Authorization: Bearer {token}
```

Response:
```json
{
  "posts": [
    {
      "post_id": "post_abc123",
      "author": {
        "user_id": "user_456",
        "username": "johndoe",
        "avatar_url": "https://cdn.example.com/avatars/user_456.jpg",
        "verified": false
      },
      "content": "Just shipped a new feature!...",
      "created_at": "2024-01-15T10:30:00Z",
      "like_count": 142,
      "comment_count": 23,
      "is_liked": false,
      "media": []
    }
  ],
  "next_cursor": "post_abc100",
  "has_more": true
}
```

**Why cursor-based pagination?**

"Offset-based pagination (`?page=2&limit=20`) breaks when new posts are inserted — page 2 shifts. Cursor-based pagination anchors to a specific post_id. New posts appearing at the top don't affect where you are in the feed. I use post_id as cursor because it's stable and indexed."

### Follow / Unfollow

```http
POST /v1/users/{user_id}/follow
DELETE /v1/users/{user_id}/follow
```

### Like Post

```http
POST /v1/posts/{post_id}/like
DELETE /v1/posts/{post_id}/like
```

### User Profile + Their Posts

```http
GET /v1/users/{user_id}/posts?cursor={cursor}&limit=20
```

### Python FastAPI Implementation

```python
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, constr
from typing import Optional

app = FastAPI()

class CreatePostRequest(BaseModel):
    content: constr(min_length=1, max_length=280)
    visibility: str = "public"

@app.post("/v1/posts", status_code=201)
async def create_post(
    req: CreatePostRequest,
    current_user: User = Depends(get_current_user)
):
    post = await post_service.create(
        user_id=current_user.id,
        content=req.content,
        visibility=req.visibility
    )
    # Trigger async fan-out
    await fanout_queue.publish({
        "type": "NEW_POST",
        "post_id": post.id,
        "user_id": current_user.id,
        "follower_count": await follow_service.get_follower_count(current_user.id)
    })
    return post

@app.get("/v1/feed")
async def get_feed(
    cursor: Optional[str] = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    return await feed_service.get_feed(
        user_id=current_user.id,
        cursor=cursor,
        limit=min(limit, 100)  # cap at 100
    )
```
""",

4: """## Session 4: Database Schema

### Post Storage: PostgreSQL

```sql
CREATE TABLE posts (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    content      VARCHAR(280) NOT NULL,
    visibility   VARCHAR(20) NOT NULL DEFAULT 'public',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ,
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    like_count   BIGINT NOT NULL DEFAULT 0,
    comment_count BIGINT NOT NULL DEFAULT 0,
    repost_count BIGINT NOT NULL DEFAULT 0
);

-- For profile page: user's posts in reverse chronological order
CREATE INDEX idx_posts_user_created
    ON posts(user_id, created_at DESC)
    WHERE is_deleted = FALSE;

-- For direct post lookup
CREATE INDEX idx_posts_id_user
    ON posts(id, user_id);
```

### Follow Graph: Cassandra (wide-column)

```sql
-- "Who does user X follow?" — for fan-out on post
CREATE TABLE following (
    follower_id  BIGINT,
    followee_id  BIGINT,
    followed_at  TIMESTAMP,
    PRIMARY KEY (follower_id, followee_id)
) WITH CLUSTERING ORDER BY (followee_id ASC);

-- "Who follows user X?" — for fan-out worker
CREATE TABLE followers (
    followee_id  BIGINT,
    follower_id  BIGINT,
    followed_at  TIMESTAMP,
    PRIMARY KEY (followee_id, follower_id)
) WITH CLUSTERING ORDER BY (follower_id ASC);
```

**Why Cassandra for the follow graph?**

"The follow graph has 250 billion edges. The access patterns are: 'give me all followers of user X' (for fan-out) and 'give me all users that X follows' (for feed generation). Both are full-partition scans. Cassandra's partition model — `followers` partitioned by followee_id, `following` partitioned by follower_id — makes each of these a single partition read. PostgreSQL would need a 250B-row table with two indexes, which is far more expensive to maintain."

### Feed Cache: Redis

```python
# Feed is a sorted set of post_ids, scored by timestamp
# Key: feed:{user_id}
# Members: post_id strings
# Scores: Unix timestamp (for chronological ordering)

import redis.asyncio as aioredis

redis = aioredis.from_url("redis://localhost")

async def add_to_feed(user_id: int, post_id: int, timestamp: float):
    key = f"feed:{user_id}"
    await redis.zadd(key, {str(post_id): timestamp})
    # Trim to max 1000 entries (keep only recent posts)
    await redis.zremrangebyrank(key, 0, -1001)
    # TTL: if user hasn't opened app in 7 days, expire cache
    await redis.expire(key, 7 * 86400)

async def get_feed(user_id: int, cursor_post_id: Optional[int] = None, limit: int = 20) -> list[int]:
    key = f"feed:{user_id}"

    if cursor_post_id:
        # Get the score (timestamp) of the cursor post
        cursor_score = await redis.zscore(key, str(cursor_post_id))
        if cursor_score:
            # Get posts older than the cursor
            post_ids = await redis.zrangebyscore(
                key, "-inf", f"({cursor_score}",  # exclusive of cursor
                start=0, num=limit,
                withscores=False
            )
        else:
            post_ids = []
    else:
        # First page: get most recent
        post_ids = await redis.zrevrange(key, 0, limit - 1)

    return [int(pid) for pid in post_ids]
```

### Likes: Counter + Deduplication

```sql
-- PostgreSQL: track individual likes for dedup
CREATE TABLE post_likes (
    post_id   BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    liked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_likes_user ON post_likes(user_id, liked_at DESC);
```

**High-traffic optimization:** Use Redis INCR for like counts, batch-flush to PostgreSQL every 60 seconds. Same pattern as URL shortener click counting.

```python
async def like_post(post_id: int, user_id: int) -> bool:
    # Atomic set-based dedup check in Redis
    like_key = f"likes:{post_id}"
    added = await redis.sadd(like_key, str(user_id))
    if added == 0:
        return False  # Already liked

    # Increment counter
    await redis.incr(f"like_count:{post_id}")

    # Write to DB asynchronously
    await db_queue.enqueue("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)", post_id, user_id)
    return True
```
""",

5: """## Session 5: High-Level Architecture

### System Architecture

```mermaid
graph TB
    subgraph Clients
        App[Mobile/Web App]
    end

    subgraph API ["API Layer"]
        LB[Load Balancer]
        GW[API Gateway]
        PostAPI[Post Service]
        FeedAPI[Feed Service]
        FollowAPI[Follow Service]
    end

    subgraph FanOut ["Fan-Out Layer"]
        Kafka[Kafka<br/>post_events topic]
        FW1[Fan-Out Worker<br/>normal users]
        FW2[Fan-Out Worker<br/>celebrities pull]
    end

    subgraph Storage
        PG[(PostgreSQL<br/>Posts + Likes)]
        Cass[(Cassandra<br/>Follow Graph)]
        Redis[(Redis Cluster<br/>Feed Cache)]
        CDN[CDN<br/>Media + Static]
    end

    subgraph Notifs ["Notifications"]
        NS[Notification Service]
        Push[Push / Email]
    end

    App --> LB --> GW
    GW --> PostAPI & FeedAPI & FollowAPI
    PostAPI --> PG
    PostAPI --> Kafka
    FollowAPI --> Cass
    Kafka --> FW1 & FW2
    FW1 --> Redis
    FW2 --> Redis
    FeedAPI --> Redis
    FeedAPI --> PG
    FeedAPI --> Cass
    Kafka --> NS --> Push
```

### Fan-Out Flow: New Post by Normal User

```mermaid
sequenceDiagram
    participant U as User (normal, 500 followers)
    participant PostSvc as Post Service
    participant Kafka
    participant FW as Fan-Out Worker
    participant Cass as Cassandra (followers)
    participant Redis as Redis (feed cache)

    U->>PostSvc: POST /v1/posts
    PostSvc->>PG: INSERT post
    PostSvc->>Kafka: publish {post_id, user_id, follower_count=500}
    PostSvc-->>U: 201 Created

    Kafka->>FW: consume event
    FW->>Cass: GET followers of user (page 1: 500 users)
    Cass-->>FW: [follower_id_1, ..., follower_id_500]
    FW->>Redis: ZADD feed:follower_1 {score=timestamp, member=post_id}
    FW->>Redis: ZADD feed:follower_2 ...
    Note over FW,Redis: 500 Redis ZADDs in parallel batches
```

### Fan-Out Flow: Celebrity Post (Hybrid Approach)

```mermaid
sequenceDiagram
    participant C as Celebrity (10M followers)
    participant PostSvc as Post Service
    participant Kafka
    participant FW as Fan-Out Worker

    C->>PostSvc: POST /v1/posts
    PostSvc->>Kafka: publish {post_id, user_id, follower_count=10_000_000, is_celebrity=true}
    PostSvc-->>C: 201 Created

    Note over Kafka,FW: Celebrity flag → different handling
    Kafka->>FW: consume event (celebrity=true)
    FW->>PG: store post as "celebrity post" (no fan-out)

    Note right of FW: Fan-out skipped!

    participant App as Fan's App
    App->>FeedAPI: GET /v1/feed
    FeedAPI->>Redis: get fan's feed cache
    FeedAPI->>Cass: get fan's followee list → check celebrity accounts
    FeedAPI->>PG: fetch recent posts from celebrity accounts
    FeedAPI-->>App: merge cached feed + celebrity posts
```

### Feed Read Path

```python
class FeedService:
    async def get_feed(self, user_id: int, cursor: Optional[str], limit: int) -> FeedResponse:
        # 1. Get pre-computed feed from Redis cache
        cached_post_ids = await self.get_cached_feed(user_id, cursor, limit * 2)

        # 2. Identify which followees are celebrities (pull mode)
        celebrity_followees = await self.get_celebrity_followees(user_id)

        celebrity_posts = []
        if celebrity_followees:
            # 3. Fetch recent posts from celebrities (on read)
            celebrity_posts = await self.fetch_celebrity_posts(
                celebrity_followees, limit=limit
            )

        # 4. Merge and sort
        all_post_ids = self.merge_sorted(cached_post_ids, [p.id for p in celebrity_posts])

        # 5. Hydrate: fetch full post data from PostgreSQL (or post cache)
        posts = await self.hydrate_posts(all_post_ids[:limit], viewer_id=user_id)

        next_cursor = posts[-1].id if posts else None
        return FeedResponse(posts=posts, next_cursor=next_cursor, has_more=len(posts) == limit)

    async def hydrate_posts(self, post_ids: list[int], viewer_id: int) -> list[PostDetail]:
        \"\"\"Fetch post content, author info, and viewer's like status.\"\"\"
        # Batch fetch from Redis post cache, fall back to PostgreSQL
        post_cache_keys = [f"post:{pid}" for pid in post_ids]
        cached = await redis.mget(*post_cache_keys)

        missing_ids = [pid for pid, cached_val in zip(post_ids, cached) if not cached_val]

        if missing_ids:
            db_posts = await db.fetch(
                "SELECT * FROM posts WHERE id = ANY($1::bigint[]) AND is_deleted = FALSE",
                missing_ids
            )
            # Populate cache
            pipe = redis.pipeline()
            for post in db_posts:
                pipe.setex(f"post:{post.id}", 3600, json.dumps(dict(post)))
            await pipe.execute()

        # ... merge and return
```
""",

6: """## Session 6: Deep Dive — Fan-Out Strategies

This is the session that determines if you pass or fail the news feed interview. You must understand all three strategies deeply, with their exact trade-offs.

### Strategy 1: Fan-Out on Write (Push Model)

**How it works:** When a post is created, immediately write a reference to it in each follower's feed cache.

```python
async def fanout_on_write(post_id: int, author_id: int):
    \"\"\"Push post to all followers' feed caches.\"\"\"
    PAGE_SIZE = 1000
    offset = 0

    while True:
        # Get next batch of followers
        followers = await cassandra.execute(
            \"\"\"SELECT follower_id FROM followers
               WHERE followee_id = %s LIMIT %s OFFSET %s\"\"\",
            [author_id, PAGE_SIZE, offset]
        )
        if not followers:
            break

        # Write to each follower's Redis feed in parallel
        pipe = redis.pipeline()
        for follower in followers:
            feed_key = f"feed:{follower.follower_id}"
            pipe.zadd(feed_key, {str(post_id): time.time()})
            pipe.zremrangebyrank(feed_key, 0, -1001)  # keep only 1000 entries
        await pipe.execute()

        offset += PAGE_SIZE

    # Time for 1M followers at 10K writes/sec = 100 seconds → too slow for big accounts!
```

**Pros:** Feed reads are O(1) — just read from cache. Very fast.

**Cons:** Write amplification. 1M followers = 1M Redis writes. 10M followers = 10M writes. Celebrities cause fan-out storms lasting minutes.

**Best for:** Users with < 10,000 followers.

---

### Strategy 2: Fan-Out on Read (Pull Model)

**How it works:** When user opens feed, dynamically fetch posts from all followees.

```python
async def fanout_on_read(user_id: int, limit: int = 20) -> list:
    # Get all followees
    followees = await cassandra.execute(
        "SELECT followee_id FROM following WHERE follower_id = %s",
        [user_id]
    )
    followee_ids = [f.followee_id for f in followees]

    # Fetch recent posts from each followee (N-way merge)
    if not followee_ids:
        return []

    posts = await db.fetch(
        \"\"\"SELECT * FROM posts
           WHERE user_id = ANY($1::bigint[])
           AND is_deleted = FALSE
           ORDER BY created_at DESC
           LIMIT $2\"\"\",
        followee_ids, limit
    )
    return posts
```

**Problem at scale:**

```sql
-- If user follows 5,000 people, this query scans:
-- WHERE user_id = ANY([5000 user IDs])
-- Even with index on (user_id, created_at):
-- PostgreSQL must check 5000 index partitions → slow

-- At 57,800 feed reads/sec with avg 500 followees each:
-- 57,800 * 500 = 28.9M DB lookups/sec → impossible
```

**Pros:** No write amplification. Celebrity posts available instantly.

**Cons:** Read is expensive and slow, especially for users with many followings.

**Best for:** Rarely used as a sole strategy. Used only for celebrities.

---

### Strategy 3: Hybrid (Production Standard)

```python
CELEBRITY_THRESHOLD = 500_000  # followers

async def create_post(author_id: int, content: str) -> Post:
    post = await db_create_post(author_id, content)
    follower_count = await get_follower_count(author_id)

    if follower_count <= CELEBRITY_THRESHOLD:
        # Normal user: push to all followers
        await kafka.publish("fan_out_push", {
            "post_id": post.id,
            "author_id": author_id,
            "mode": "push"
        })
    else:
        # Celebrity: just store the post, let reads pull it
        await kafka.publish("fan_out_push", {
            "post_id": post.id,
            "author_id": author_id,
            "mode": "pull_only"  # Don't fan out
        })

    return post

async def get_feed_hybrid(user_id: int, cursor=None, limit=20) -> list:
    # 1. Get pre-computed feed (normal users' posts)
    pushed_post_ids = await redis.zrevrange(f"feed:{user_id}", 0, 99)

    # 2. Get list of celebrity followees
    celebrity_ids = await get_celebrity_followees(user_id)

    # 3. Fetch recent posts from celebrities (pull)
    celebrity_posts = []
    if celebrity_ids:
        celebrity_posts = await db.fetch(
            \"\"\"SELECT id, created_at FROM posts
               WHERE user_id = ANY($1::bigint[])
               AND created_at > NOW() - INTERVAL '7 days'
               ORDER BY created_at DESC LIMIT 50\"\"\",
            celebrity_ids
        )

    # 4. Merge: combine pushed IDs + celebrity post IDs, sort by timestamp
    all_posts = merge_by_timestamp(
        [{"id": pid, "ts": get_ts_from_id(pid)} for pid in pushed_post_ids],
        [{"id": p.id, "ts": p.created_at} for p in celebrity_posts]
    )

    # 5. Paginate
    if cursor:
        all_posts = [p for p in all_posts if p["ts"] < get_ts_from_cursor(cursor)]

    return all_posts[:limit]
```

---

### The Edge Case: New User (Cold Start)

When a user signs up, their feed cache is empty. On first feed load:

```python
async def build_feed_for_new_user(user_id: int):
    \"\"\"On first login, or if feed cache is empty.\"\"\"
    # Kick off async feed build
    await kafka.publish("build_feed", {"user_id": user_id})

    # Return something immediately (popular/trending posts)
    return await get_trending_posts(limit=20)

async def _build_feed_worker(user_id: int):
    \"\"\"Background worker: builds feed cache from scratch.\"\"\"
    followees = await get_followees(user_id)
    posts = await db.fetch(
        \"\"\"SELECT id, created_at FROM posts
           WHERE user_id = ANY($1::bigint[])
           AND created_at > NOW() - INTERVAL '7 days'
           ORDER BY created_at DESC LIMIT 1000\"\"\",
        followees
    )

    pipe = redis.pipeline()
    for post in posts:
        pipe.zadd(f"feed:{user_id}", {str(post.id): post.created_at.timestamp()})
    pipe.expire(f"feed:{user_id}", 7 * 86400)
    await pipe.execute()
```

---

### Comparison Table

| Dimension | Push (Write) | Pull (Read) | Hybrid |
|---|---|---|---|
| Feed read speed | O(1) — very fast | O(F) — slow | O(1) + O(C) where C=celebrity count |
| Write cost | O(F) per post | O(1) per post | O(F) for normal, O(1) for celebrities |
| Celebrity handling | Broken | Works | Works |
| New user cold start | No history | Immediate | Needs seeding |
| Storage | High (N feeds) | Low | Medium |
| Used by | Small apps | Prototypes | Twitter, Facebook, Instagram |
""",

7: """## Session 7: Deep Dive — Feed Ranking & Caching

While chronological feeds are simpler, understanding ranking is important for showing architectural depth.

### Feed Ranking Pipeline

Even for "chronological" feeds, there are layers of filtering and boosting:

```mermaid
graph LR
    Raw[Raw Feed<br/>1000 post IDs] --> Filter[Filter Layer<br/>blocked users, spam]
    Filter --> Score[Score Layer<br/>recency + engagement]
    Score --> Rank[Rank Layer<br/>final sort]
    Rank --> Top[Top 20 posts<br/>returned to user]
```

### Scoring Function (Simple Chronological + Boost)

```python
import math
from datetime import datetime, timezone

def score_post(post: dict, viewer_id: int) -> float:
    \"\"\"
    Score a post for display in viewer's feed.
    Higher score = shown earlier.
    \"\"\"
    # Base: recency (decay over 48 hours)
    now = datetime.now(timezone.utc)
    age_hours = (now - post["created_at"]).total_seconds() / 3600
    recency_score = 1.0 / (1.0 + age_hours / 12)  # half-life of 12 hours

    # Engagement boost (log scale to prevent viral content dominating)
    likes = post.get("like_count", 0)
    comments = post.get("comment_count", 0)
    engagement = math.log1p(likes + 2 * comments)  # comments weighted 2x

    # Relationship boost (author is close friend)
    relationship_score = 1.5 if post["author_id"] in viewer_close_friends else 1.0

    return recency_score * (1 + 0.1 * engagement) * relationship_score
```

### Multi-Layer Cache Architecture

```
Layer 1: CDN Cache (Cloudflare)
  What: Rendered HTML/JSON for public profile pages
  TTL: 60 seconds
  Hit rate: 40% (repeat requests for same profile)

Layer 2: Application Cache (Redis)
  What: Post objects, user profiles, feed lists
  TTL: 1-24 hours depending on type
  Hit rate: 90%

Layer 3: Database (PostgreSQL + Cassandra)
  What: Source of truth for all data
  Hit rate: 100% (always has data)
```

### Post Object Cache

Individual posts are read millions of times. Cache aggressively:

```python
class PostCache:
    POST_TTL = 3600  # 1 hour
    HOT_POST_TTL = 300  # 5 minutes (refresh frequently for like counts)

    async def get_post(self, post_id: int, viewer_id: int) -> dict:
        cache_key = f"post:{post_id}"
        cached = await redis.get(cache_key)

        if cached:
            post = json.loads(cached)
        else:
            post = await db.fetchrow(
                "SELECT * FROM posts WHERE id = $1 AND is_deleted = FALSE",
                post_id
            )
            if not post:
                return None
            post = dict(post)
            await redis.setex(cache_key, self.POST_TTL, json.dumps(post))

        # Viewer-specific data (not cached — varies per viewer)
        post["is_liked"] = await self.get_like_status(post_id, viewer_id)
        post["is_following_author"] = await self.get_follow_status(viewer_id, post["user_id"])

        return post

    async def invalidate(self, post_id: int):
        \"\"\"Called when post is liked, commented on, or deleted.\"\"\"
        await redis.delete(f"post:{post_id}")
```

### User Profile Cache

```python
async def get_user_profile(user_id: int) -> dict:
    cache_key = f"user:{user_id}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    user = await db.fetchrow(
        \"\"\"SELECT id, username, display_name, bio, avatar_url,
                  follower_count, following_count, post_count
           FROM users WHERE id = $1\"\"\",
        user_id
    )
    profile = dict(user)
    # Cache for 5 minutes (follower counts change frequently)
    await redis.setex(cache_key, 300, json.dumps(profile))
    return profile
```

### TypeScript Feed Hook

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

interface FeedPost {
  postId: string
  author: { userId: string; username: string; avatarUrl: string }
  content: string
  createdAt: string
  likeCount: number
  isLiked: boolean
}

interface FeedPage {
  posts: FeedPost[]
  nextCursor: string | null
  hasMore: boolean
}

export function useFeed() {
  return useInfiniteQuery<FeedPage>({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined
      const url = `/api/v1/feed${cursor ? `?cursor=${cursor}` : ''}&limit=20`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      if (!res.ok) throw new Error('Failed to load feed')
      return res.json()
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30_000,  // 30 seconds before refetch
    refetchInterval: 60_000,  // Poll for new posts every minute
  })
}
```
""",

8: """## Session 8: Scaling & Bottlenecks

### The Write Amplification Problem at Scale

```
Scenario: Taylor Swift (50M followers) posts once per day.
Fan-out cost at 10,000 Redis writes/second:
  50M writes / 10K writes/sec = 5,000 seconds (83 minutes!)

Even with 100 fan-out workers (1M writes/sec):
  50M / 1M = 50 seconds

Result: Taylor's post appears in fans' feeds 50 seconds to 83 minutes after she posts.
This is unacceptable.
```

**Solution: Tiered celebrity threshold with read-merge**

```python
TIERS = {
    "normal":    (0, 50_000),        # push all followers
    "notable":   (50_000, 500_000),  # push + partial pull
    "celebrity": (500_000, float('inf'))  # pull only
}

def get_fanout_strategy(follower_count: int) -> str:
    for tier, (low, high) in TIERS.items():
        if low <= follower_count < high:
            return tier
    return "celebrity"
```

### Database Scaling

**PostgreSQL post sharding by user_id:**

```python
NUM_SHARDS = 64

def get_post_shard(user_id: int) -> int:
    return user_id % NUM_SHARDS

class ShardedPostDB:
    def __init__(self, shards: list[asyncpg.Pool]):
        self.shards = shards

    async def get_user_posts(self, user_id: int, limit: int) -> list:
        shard = self.shards[get_post_shard(user_id)]
        return await shard.fetch(
            "SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
            user_id, limit
        )
```

**Cassandra follow graph scaling:**

At 250B edges, Cassandra naturally handles this via consistent hashing. Add nodes to increase capacity linearly.

### Redis Cluster for Feed Cache

```
Redis Cluster layout:
  16,384 hash slots distributed across N masters
  feed:{user_id} → hash slot = CRC16("user_id") % 16384

At 800GB feed cache:
  16 nodes × 64GB each = 1TB (comfortable)
  Each node: 50K Redis ops/sec
  Total: 800K feed ops/sec across cluster

Adding capacity: add node pairs (master+replica), rebalance online
```

### CDN for Static Feed Content

For public posts (public visibility), use CDN to cache the first page of a user's profile feed:

```
GET /v1/users/{user_id}/posts → CDN cached for 60 seconds

At 1M profile views/day for a popular user:
  Without CDN: 1M/86400 = 11.6 req/sec to origin → manageable
  For celebrities (Beyoncé): 100M views/day → 1,157 req/sec
  → CDN essential for celebrity profiles
```

### Feed Pre-generation for Inactive Users

**Problem:** User hasn't opened app in 3 days. Their Redis feed cache is expired. When they open the app, feed must be rebuilt (slow).

**Solution: Scheduled feed pre-generation**

```python
# Cron job: rebuild stale feeds before users wake up
async def pregenerate_feeds():
    \"\"\"Run at 5 AM in each timezone.\"\"\"
    # Find users who last opened app 1-7 days ago (likely to return)
    likely_to_return = await db.fetch(
        \"\"\"SELECT id FROM users
           WHERE last_active BETWEEN NOW() - INTERVAL '7 days'
                                AND NOW() - INTERVAL '1 day'
           ORDER BY last_active DESC
           LIMIT 10000000\"\"\")

    for user_batch in chunk(likely_to_return, 1000):
        await fanout_queue.publish_batch([
            {"type": "REBUILD_FEED", "user_id": u.id}
            for u in user_batch
        ])
```

### Monitoring & SLOs

```
Key metrics to track:
  - feed_load_latency_p99: target < 200ms
  - fan_out_lag: time from post creation to cache write (target < 10s for normal users)
  - cache_hit_rate: target > 90%
  - celebrity_feed_merge_latency: target < 50ms

Alerts:
  - fan_out_lag > 30s → fan-out worker bottleneck, scale up
  - cache_hit_rate < 80% → Redis memory pressure, add capacity
  - feed_load_latency_p99 > 500ms → investigate DB slow queries
```
""",

9: """## Session 9: Edge Cases & Failure Modes

### Edge Case 1: Unfollow — Feed Update

When Alice unfollows Bob, Bob's posts should disappear from Alice's feed.

**Naive approach:** Delete all Bob's posts from Alice's feed cache.

```python
async def unfollow(follower_id: int, followee_id: int):
    # Remove from Cassandra follow graph
    await cassandra.execute(
        "DELETE FROM following WHERE follower_id = %s AND followee_id = %s",
        [follower_id, followee_id]
    )
    await cassandra.execute(
        "DELETE FROM followers WHERE followee_id = %s AND follower_id = %s",
        [followee_id, follower_id]
    )

    # Remove followee's posts from follower's feed cache
    # Problem: we'd need to know which post_ids belong to followee
    # Redis sorted set doesn't support "remove by author"
    # → Mark feed as stale, rebuild on next access
    await redis.delete(f"feed:{follower_id}")
```

**Better approach:** Lazy invalidation

When Alice's feed cache is invalidated, it rebuilds on next feed load. Short-term (< 60 seconds), Bob's posts may still appear. This is acceptable eventual consistency.

For strict correctness: store `(post_id, author_id)` in the feed sorted set (not just post_id), then filter at read time:

```python
async def get_feed_with_unfollow_filter(user_id: int, limit: int) -> list:
    # Get raw feed (includes recently-unfollowed authors)
    raw_feed = await redis.zrevrange(f"feed:{user_id}", 0, 99, withscores=True)

    # Get current followee set
    followees = set(await get_followees(user_id))

    # Filter out unfollowed authors at read time
    filtered = [
        (post_id, score) for post_id, score in raw_feed
        if await get_post_author(post_id) in followees
    ]
    return filtered[:limit]
```

### Edge Case 2: Post Deletion

When a post is deleted, it must disappear from all followers' feeds.

**Problem:** The post may be in 10M users' feed caches.

**Solution:** Don't remove from cache. Mark as deleted in DB. Filter at hydration time.

```python
async def delete_post(post_id: int, author_id: int):
    # Soft delete in DB
    await db.execute(
        "UPDATE posts SET is_deleted = TRUE WHERE id = $1 AND user_id = $2",
        post_id, author_id
    )
    # Invalidate post object cache
    await redis.delete(f"post:{post_id}")
    # Cache stores a "deleted" tombstone to prevent DB hammering
    await redis.setex(f"post:deleted:{post_id}", 86400, "1")
    # Note: post_id remains in feed sorted sets but returns null on hydration
    # Feed service filters out null posts

async def hydrate_posts(post_ids: list[int]) -> list[Post]:
    posts = await fetch_posts_batch(post_ids)
    # Filter deleted posts
    return [p for p in posts if p is not None and not p.is_deleted]
```

### Edge Case 3: Follow Graph Inconsistency

**Problem:** Cassandra write succeeds for `followers` table but fails for `following` table. Now Bob appears in Alice's followers but Alice doesn't appear in Bob's followings.

**Solution:** Two-phase commit with idempotent retry

```python
async def follow_with_retry(follower_id: int, followee_id: int, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            batch = cassandra.batch()
            batch.add("INSERT INTO followers (followee_id, follower_id, followed_at) VALUES (%s, %s, NOW())",
                      [followee_id, follower_id])
            batch.add("INSERT INTO following (follower_id, followee_id, followed_at) VALUES (%s, %s, NOW())",
                      [follower_id, followee_id])
            await cassandra.execute_batch(batch)
            return  # Success
        except cassandra.WriteTimeout:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(0.1 * (2 ** attempt))  # Exponential backoff
```

Cassandra batches are atomic within a partition — but these are two different partitions. A logged batch in Cassandra provides at-least-once semantics with eventual consistency. For exactly-once, use an idempotency table in PostgreSQL.

### Failure Mode 1: Redis Cluster Failure

If Redis goes down, feed reads must fall back gracefully:

```python
async def get_feed_with_fallback(user_id: int, limit: int) -> list:
    try:
        # Try Redis cache first
        return await get_feed_from_cache(user_id, limit)
    except (redis.RedisError, asyncio.TimeoutError):
        # Fallback: reconstruct feed from DB (expensive but correct)
        metrics.increment("feed.redis_fallback")
        return await get_feed_from_db_fallback(user_id, limit)

async def get_feed_from_db_fallback(user_id: int, limit: int) -> list:
    followees = await get_followees(user_id)
    if not followees:
        return []

    # Use the pull model as fallback
    return await db.fetch(
        \"\"\"SELECT * FROM posts
           WHERE user_id = ANY($1::bigint[])
           AND is_deleted = FALSE
           AND created_at > NOW() - INTERVAL '7 days'
           ORDER BY created_at DESC LIMIT $2\"\"\",
        followees, limit
    )
```

### Failure Mode 2: Fan-Out Worker Lag

If Kafka consumers fall behind (fan-out lag grows), users see stale feeds.

```python
# Monitor consumer lag
async def check_fan_out_lag():
    lag = await kafka_admin.get_consumer_group_lag("fan_out_workers")
    if lag > 100_000:  # 100K message backlog
        await scale_up_fan_out_workers(target=lag // 10_000)
        await alert_on_call("Fan-out lag critical: " + str(lag))
```

**Design decision:** Fan-out workers should be horizontally scalable. Each Kafka partition is consumed by one worker, so adding workers = adding Kafka partitions. Pre-configure 200 partitions for the fan-out topic.
""",

10: """## Session 10: Mock Interview — News Feed

**Interviewer:** "Design a news feed system — like what you see on Facebook or Twitter."

**Candidate:** "Let me clarify scope first. Are we building a feed based on follower relationships — unidirectional like Twitter — or a mutual friends model like Facebook? And are we ranking by recency or by engagement/ML?"

**Interviewer:** "Unidirectional follows, chronological ordering. Target scale: 500 million daily active users."

**Candidate:** "Got it. The core challenge with a news feed at this scale is fan-out. When someone posts, their followers need to see it. I see three approaches: push to each follower's cache when the post is created, pull from followees when the feed is loaded, or a hybrid. At 500M DAU the answer is definitely hybrid — let me explain why."

**Candidate:** "If we push to all followers on every post, a normal user with 500 followers generates 500 cache writes per post. That's totally fine. But Cristiano Ronaldo with 600 million followers? One post generates 600 million writes. At 1 million writes per second across our fan-out cluster, that's 600 seconds — 10 minutes — for his post to reach all followers. That's unacceptable. So for celebrity accounts — let's say over 500,000 followers — we skip the push. Instead, when a user with a celebrity followee loads their feed, we pull the celebrity's recent posts and merge them with the pre-computed cache."

**Interviewer:** "Walk me through the data model for the feed cache."

**Candidate:** "I'd use Redis sorted sets. Key is `feed:{user_id}`. Members are post IDs. Scores are Unix timestamps. `ZREVRANGE feed:alice 0 19` gives Alice's 20 most recent posts in reverse chronological order. Adding a new post is `ZADD feed:alice {timestamp} {post_id}`. I cap each feed at 1000 entries with `ZREMRANGEBYRANK`. If a user follows thousands of people and hasn't opened the app in a week, I let their feed cache expire and rebuild it on their next visit — triggered by a Kafka event."

**Interviewer:** "How does the database schema look for the follow graph?"

**Candidate:** "I'd use Cassandra with two tables. First: `followers` partitioned by followee_id — this answers 'who follows user X?' which I need for fan-out. Second: `following` partitioned by follower_id — this answers 'who does user X follow?' which I need when rebuilding a feed. At 500M users with an average of 500 follows each, that's 250 billion edges. Cassandra handles this naturally with horizontal partitioning. PostgreSQL with a 250-billion-row table would need very careful sharding."

**Interviewer:** "What happens when Alice unfollows Bob? How quickly do Bob's posts disappear from Alice's feed?"

**Candidate:** "This is an eventual consistency trade-off. When Alice unfollows, I remove the edge from the Cassandra follow graph immediately. Then I invalidate Alice's feed cache key in Redis. On Alice's next feed load, the system rebuilds her feed without Bob's posts. In the window between unfollow and next feed load — which could be zero to a few seconds — Alice might still see Bob's posts if she's currently scrolling. I think this is acceptable. If strict correctness is required, I can store `{post_id, author_id}` in the sorted set and filter by current followees at read time. But that adds latency to every feed load, so I'd only do it if the product team specifically requires it."

**Interviewer:** "How would you handle the case where a user's feed cache is empty — maybe they just signed up or their cache expired?"

**Candidate:** "Cold start is handled in two ways. For new signups, I show trending or popular posts while building the personalized feed asynchronously in the background — triggered by a Kafka event. For cache expiry, same thing: I check if the Redis key exists. If not, I immediately return the last 24 hours of posts from their followees via a direct DB query — expensive but fast enough for a one-time hit — and simultaneously kick off a full feed rebuild job to populate the cache for future requests."

**Interviewer:** "Your fan-out workers are Kafka consumers. What if they fall behind?"

**Candidate:** "I'd monitor consumer lag — the number of unprocessed messages in the fan-out topic. I'd alert at 50,000 message backlog and auto-scale at 100,000. Since each Kafka partition is processed by one consumer, scaling means adding more partitions and more worker instances. I'd pre-provision the fan-out topic with 200 partitions — this lets me scale to 200 concurrent workers if needed. The critical insight is that fan-out is embarrassingly parallel — each follower's feed update is independent, so more workers directly means more throughput."

**Interviewer:** "Great, let's wrap up. One final question: how do you handle a like going to a post that has already been deleted?"

**Candidate:** "At the API layer, I check post existence before processing the like. But with distributed systems, there's a race: post could be deleted between the check and the write. I'd use an idempotent insert with a foreign key check in PostgreSQL — `INSERT INTO post_likes WHERE post_id IN (SELECT id FROM posts WHERE is_deleted = FALSE)`. If the post is deleted mid-operation, the transaction rolls back and I return a 404 to the client. The client shows 'Post no longer available' and removes the optimistic UI update."

---

### Score Card

| Area | Grade | Notes |
|---|---|---|
| Requirements | A | Clarified before designing |
| Scale estimation | A | Named specific numbers |
| Fan-out strategy | A+ | Explained all 3 approaches, hybrid correctly |
| Data modeling | A | Justified Cassandra for follow graph |
| Edge cases | A | Covered unfollow, cold start, deletion |
| Failure handling | B+ | Covered Kafka lag, could add Redis failure |
""",
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

print(f"Updated {len(CONTENT)} sessions for News Feed")
