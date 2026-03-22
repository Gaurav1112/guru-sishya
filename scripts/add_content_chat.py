#!/usr/bin/env python3
"""Add content to Chat System sessions (topic index 1)."""
import json

SESSIONS = {
    1: """## Session 1: Requirements & Protocol Choice

### Interview Opening

**Interviewer:** "Design a chat system like WhatsApp or Slack."

**Candidate:** "Let me clarify scope. Is this 1-on-1 chat, group chat, or both?"

**Interviewer:** "Both 1-on-1 and group chat."

**Candidate:** "Group size limit?"

**Interviewer:** "Up to 500 members per group."

**Candidate:** "Real-time delivery requirement? If receiver is offline, do messages queue?"

**Interviewer:** "Yes — offline users receive messages when they come back online."

**Candidate:** "Media support — text only, or images/video/files too?"

**Interviewer:** "Text and images. No video calls."

**Candidate:** "Scale — DAU?"

**Interviewer:** "50 million DAU."

### Functional Requirements

- 1-on-1 messaging with real-time delivery
- Group messaging (up to 500 members)
- Message persistence — offline users receive queued messages on reconnect
- Read receipts: sent, delivered, read indicators
- Online presence: show when users were last online
- Image sharing (up to 10MB per image)
- Message history: scroll back up to 1 year

### Non-Functional Requirements

- Message delivery latency: <500ms when both parties online
- High availability: 99.99% (messages must never be lost)
- Message ordering: guaranteed per conversation
- Scalability: 50M DAU, 100M messages/day
- Eventual consistency acceptable for presence information

### Protocol Decision: WebSocket vs. Polling vs. SSE

| Protocol | Pros | Cons |
|---|---|---|
| Short polling | Simple, works everywhere | High latency (1-30s), wastes bandwidth |
| Long polling | Lower latency than polling | Still HTTP overhead, complex server-side |
| **WebSocket** | **True bidirectional, real-time** | **Connection management at scale** |
| SSE (Server-Sent Events) | Simple, HTTP-based | Server → client only, no bidirectional |

**Decision: WebSocket for active chat clients.** HTTP long polling as fallback for environments that block WebSocket (some corporate firewalls).

WebSocket handshake: upgrades from HTTP to persistent TCP connection. Server can push messages to client without client polling. One connection per device — a user with phone + desktop = 2 connections.

### Connection Management Design

Each Chat Server maintains WebSocket connections for a set of users. A connection registry (Redis) maps `user_id → [server_id, connection_id]` so any server can route messages to the right Chat Server.

```
User A connects to Chat Server 1
User B connects to Chat Server 3
A sends message to B:
  → Chat Server 1 looks up B's server → "Chat Server 3"
  → Sends via internal messaging to Chat Server 3
  → Chat Server 3 delivers to B's WebSocket connection
```

### Interview Q&A

**Q: Why not use HTTP/2 server push instead of WebSocket?**
A: HTTP/2 server push is designed for pushing page assets, not arbitrary messages. WebSocket is purpose-built for persistent bidirectional communication with low overhead (2-byte frame headers vs full HTTP headers on each message).

**Q: How many WebSocket connections can one server hold?**
A: A modern server (8 vCPU, 32GB RAM) can hold ~100,000 simultaneous WebSocket connections. At 50M DAU with 20% concurrently active = 10M connections → needs 100 Chat Servers. This is the primary scaling challenge.""",

    2: """## Session 2: Capacity Estimation

### Traffic Estimation

**Users:**
- 50M DAU
- Peak concurrent users: 20% of DAU = **10M simultaneous connections**
- Average session: 30 minutes, 3 sessions/day = 90 minutes online/day

**Messages:**
- 100M messages/day
- 100M / 86,400 = **1,157 messages/sec** average
- Peak (5x): **~6,000 messages/sec**
- Per message size: avg 100 bytes (text) + metadata = **~200 bytes/message**

**Message storage:**
- 100M messages/day × 200 bytes = 20GB/day
- 5-year retention: 20GB × 365 × 5 = **36.5 TB total**
- Cassandra handles this volume easily

**Images:**
- Assume 10% of messages are images: 10M images/day
- Average image: 500KB (after compression)
- 10M × 500KB = **5TB/day** → store in object storage (S3)
- Image metadata in DB: 10M × 200 bytes = 2GB/day

### Connection Estimation

- 10M simultaneous WebSocket connections
- 100 Chat Servers × 100K connections/server = 10M ✓
- Each server: 8 vCPU, 32GB RAM
- Memory per connection: ~2KB (socket buffer + user metadata) = 200MB for 100K connections ✓

### Bandwidth

- **Inbound** (messages sent): 6,000 msg/sec × 200 bytes = **1.2 MB/s** (trivial)
- **Outbound** (messages delivered): 1:1 and group messages
  - 1:1: same as inbound = 1.2 MB/s
  - Group (avg 20 members): 6,000 × 20 × 200B = **24 MB/s**
- **Image uploads**: 10M × 500KB / 86,400s = **57 MB/s** inbound

### Storage Architecture Sizing

**Message store (Cassandra):**
- 36.5 TB over 5 years
- Cassandra cluster: 20 nodes × 2TB SSD each = 40TB
- Replication factor 3: effectively stores 13.3TB of unique data → **need 30 nodes**

**Presence store (Redis):**
- 50M users × 50 bytes (last_seen, status) = 2.5GB — fits in single Redis instance

**Connection registry (Redis):**
- 10M active connections × 100 bytes = 1GB

**Media store (S3):**
- 5TB/day → S3 scales automatically, no capacity planning needed
- CDN for image delivery

### Interview Q&A

**Q: How do you estimate concurrent connections from DAU?**
A: Empirically, 15-25% of DAU are concurrently active during peak hours. For a global 50M DAU app: 50M × 20% = 10M. This is the load your WebSocket servers must handle simultaneously.

**Q: How many Cassandra nodes do you need?**
A: At 36.5TB total, with replication factor 3, you need 36.5TB × 3 / (2TB per node) ≈ 55 nodes. I'd provision 60 to allow for growth and hotspot headroom.""",

    3: """## Session 3: Single-Server Chat Architecture

### Core Message Flow

```mermaid
sequenceDiagram
    participant A as User A (Sender)
    participant CS1 as Chat Server 1
    participant MQ as Message Queue
    participant CS2 as Chat Server 2
    participant B as User B (Receiver)
    participant DB as Message DB

    A->>CS1: WebSocket: send_message {to: B, text: "Hi"}
    CS1->>DB: INSERT message (id, from, to, text, timestamp)
    CS1->>MQ: publish message_event
    CS1->>A: ACK {message_id: "msg_123", status: "sent"}
    MQ->>CS2: deliver message_event
    CS2->>B: WebSocket push {from: A, text: "Hi", id: "msg_123"}
    CS2->>MQ: publish delivery_receipt
    MQ->>CS1: delivery_receipt
    CS1->>A: WebSocket push {type: "delivered", message_id: "msg_123"}
```

### Component Architecture

```mermaid
graph TD
    ClientA([User A])
    ClientB([User B])
    LB[Load Balancer\nLayer 7]
    CS1[Chat Server 1\nWebSocket]
    CS2[Chat Server 2\nWebSocket]
    CR[Connection Registry\nRedis]
    MDB[(Message DB\nCassandra)]
    MQ[Message Queue\nKafka]
    AS[API Server\nHTTP REST]
    S3[Object Storage\nS3 for images]

    ClientA -->|WebSocket| LB
    ClientB -->|WebSocket| LB
    LB -->|sticky sessions| CS1
    LB -->|sticky sessions| CS2
    CS1 <-->|lookup user connection| CR
    CS2 <-->|lookup user connection| CR
    CS1 <-->|pub/sub message routing| MQ
    CS2 <-->|pub/sub message routing| MQ
    CS1 -->|persist message| MDB
    CS2 -->|persist message| MDB
    ClientA -->|upload image| AS
    AS -->|store| S3
```

### Load Balancer: Sticky Sessions

WebSocket connections are long-lived. The load balancer must use sticky sessions (consistent hashing by `user_id`) so reconnections go to the same Chat Server that holds the existing connection state.

If a Chat Server crashes, connections drop. Clients detect the disconnect and reconnect — the LB routes them to a healthy server. Connection registry in Redis updates automatically.

### Message Persistence Strategy

Messages are written to Cassandra **before** being delivered to the recipient. This ensures no message is lost even if the Chat Server crashes mid-delivery.

Write pattern:
1. Receive message from sender
2. Write to Cassandra (synchronous — we need durability)
3. Send ACK to sender
4. Route to recipient (best effort — if routing fails, recipient will poll on reconnect)

### Offline Message Delivery

When User B is offline:
1. Chat Server 1 checks Connection Registry: `GET user:B:server` → nil (offline)
2. Message is persisted to Cassandra with `delivered = false`
3. When B reconnects: Chat Server fetches all undelivered messages from Cassandra

```cql
SELECT * FROM messages
WHERE recipient_id = B
AND delivered = false
ORDER BY created_at ASC;
```

### Interview Q&A

**Q: Why not use a traditional message queue (RabbitMQ) instead of Kafka?**
A: Both work, but Kafka provides message replay — critical for debugging and catching up offline consumers. Kafka also scales to millions of messages/sec. For a chat system with 6K msg/sec, either works, but Kafka's durability and replay capability make it the better production choice.

**Q: How do you handle network partition between Chat Servers?**
A: Chat Servers communicate via Kafka, not directly. If Chat Server 1 can't reach Chat Server 2, it publishes the message to Kafka. Chat Server 2 consumes from Kafka independently — the partition doesn't affect message delivery, only increases latency slightly.""",

    4: """## Session 4: Multi-Server Scaling

### The Cross-Server Routing Problem

With 100 Chat Servers, when User A (on Server 1) sends a message to User B (on Server 47), Server 1 must know to route to Server 47.

### Solution: Redis-Based Connection Registry

```
User connects → Chat Server stores: SET user:{user_id}:server {server_id} EX 3600
User sends message → Chat Server looks up: GET user:{recipient_id}:server → "server_47"
Chat Server 1 → publishes to Kafka topic "server_47_inbox"
Chat Server 47 → subscribes to "server_47_inbox" → delivers to B
```

### Architecture with Message Routing

```mermaid
graph LR
    A([User A]) -->|WebSocket| CS1[Chat Server 1]
    B([User B]) -->|WebSocket| CS47[Chat Server 47]
    CS1 -->|SET user_A:server=1| Redis[(Connection Registry\nRedis)]
    CS47 -->|SET user_B:server=47| Redis
    CS1 -->|GET user_B:server → 47| Redis
    CS1 -->|publish to server_47_inbox| Kafka[(Kafka)]
    Kafka -->|consume| CS47
    CS47 -->|push to B| B
```

### Scaling Strategy: 100 → 1,000 Chat Servers

**Horizontal scaling steps:**

1. **Stateless Chat Servers** — all state in Redis and Cassandra, Chat Servers hold no permanent state (only active connections)
2. **Redis Cluster for connection registry** — shard across 10 Redis nodes, each holding 1M user→server mappings
3. **Kafka partitioning** — partition by `recipient_user_id` → each Chat Server consumes specific partitions
4. **Load balancer**: consistent hash by `user_id` → user always reconnects to same server if still alive

### Service Discovery

Chat Servers register themselves in ZooKeeper/etcd on startup:
```
/chat-servers/server-001 → {"host": "10.0.1.1", "port": 8080, "connections": 87432}
/chat-servers/server-002 → {"host": "10.0.1.2", "port": 8080, "connections": 91203}
```

Load balancer reads this registry to find healthy servers and their current load.

### Handling Server Failures

```mermaid
sequenceDiagram
    participant CS1 as Chat Server 1 (fails)
    participant LB as Load Balancer
    participant A as User A
    participant CS2 as Chat Server 2

    Note over CS1: Server crash
    LB->>LB: Health check fails
    LB->>LB: Remove CS1 from pool
    A->>A: WebSocket disconnect detected
    A->>LB: Reconnect request
    LB->>CS2: Route A to CS2
    CS2->>Redis: SET user_A:server=CS2
    CS2->>Cassandra: Fetch undelivered messages for A
    CS2->>A: Deliver buffered messages
```

Recovery time: 10-30 seconds (health check interval + reconnect + message sync).

### Rate Limiting Per Connection

Prevent abuse: each WebSocket connection is rate-limited to 60 messages/minute.

```python
# Per-connection rate limiter using token bucket in Redis
def check_rate_limit(user_id):
    key = f"rate:{user_id}"
    current = redis.get(key) or 0
    if int(current) >= 60:
        raise RateLimitExceeded()
    redis.incr(key)
    redis.expire(key, 60)  # rolling 60-second window
```

### Interview Q&A

**Q: What happens to messages in Kafka if a Chat Server crashes while consuming?**
A: Kafka consumer groups use offset commits. When the Chat Server crashes, its partition is reassigned to another consumer (Chat Server) in the group. The new consumer picks up from the last committed offset — messages are reprocessed. This may cause duplicate delivery, which is why message IDs are idempotent and clients deduplicate by message_id.

**Q: How do you ensure message ordering per conversation?**
A: Kafka partitioning by `conversation_id` guarantees in-order delivery within a conversation. Cassandra clustering key by `created_at` (TIMEUUID) ensures chronological order in storage. Client assigns monotonically increasing sequence numbers — gaps signal missed messages.""",

    5: """## Session 5: Message Persistence & Cassandra

### Why Cassandra for Messages?

| Requirement | Cassandra | PostgreSQL |
|---|---|---|
| Write throughput | 50K+ writes/sec per node | ~5K writes/sec |
| Storage at 36TB | Horizontal sharding built-in | Complex manual sharding |
| Read pattern | Point queries by conversation | Same, but slower at scale |
| Availability | Tunable consistency, no single master | Primary/replica failover |
| Time-series data | Native clustering by time | Works but not optimized |

**Cassandra wins for high-write, time-series, large-scale message storage.**

### Schema Design

```cql
-- Direct messages between two users
CREATE TABLE direct_messages (
    conversation_id  UUID,
    message_id       TIMEUUID,
    sender_id        BIGINT,
    recipient_id     BIGINT,
    message_type     TEXT,       -- 'text', 'image', 'system'
    content          TEXT,
    media_url        TEXT,       -- S3 URL for images
    delivered        BOOLEAN,
    read_at          TIMESTAMP,
    created_at       TIMESTAMP,
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC)
  AND default_time_to_live = 31536000;  -- 1 year TTL

-- conversation_id = sorted concat of user IDs
-- e.g., user 100 + user 200 → "100_200" (smaller ID first)

-- Group messages
CREATE TABLE group_messages (
    group_id         UUID,
    message_id       TIMEUUID,
    sender_id        BIGINT,
    message_type     TEXT,
    content          TEXT,
    media_url        TEXT,
    created_at       TIMESTAMP,
    PRIMARY KEY (group_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC)
  AND default_time_to_live = 31536000;

-- User inbox: track which messages are unread for a user
CREATE TABLE user_inbox (
    user_id          BIGINT,
    conversation_id  UUID,
    last_message_id  TIMEUUID,
    unread_count     INT,
    updated_at       TIMESTAMP,
    PRIMARY KEY (user_id, updated_at)
) WITH CLUSTERING ORDER BY (updated_at DESC);
```

### TIMEUUID for Message IDs

`TIMEUUID` embeds a 60-bit timestamp (100-nanosecond intervals since 1582) plus a unique node identifier. Properties:
- **Sortable by time** — messages naturally order chronologically
- **Globally unique** — no coordination needed between nodes
- **Conflict-free** — two messages created at the same millisecond still have different UUIDs

Query "last 50 messages in conversation":
```cql
SELECT * FROM direct_messages
WHERE conversation_id = ?
LIMIT 50;
-- Returns most recent 50 due to DESC clustering order
```

### Pagination (Cursor-Based)

```cql
-- First page
SELECT * FROM direct_messages
WHERE conversation_id = ?
LIMIT 50;

-- Next page (use last message_id as cursor)
SELECT * FROM direct_messages
WHERE conversation_id = ?
AND message_id < ?  -- cursor from previous page
LIMIT 50;
```

### Write Path Optimization

**Batch writes:** Bundle ACK write + message write into single Cassandra logged batch:
```cql
BEGIN LOGGED BATCH
  INSERT INTO direct_messages (...) VALUES (...)
  INSERT INTO user_inbox (...) VALUES (...)
APPLY BATCH;
```

Logged batches are atomic — either both writes succeed or neither does.

**Write concern:** `LOCAL_QUORUM` (2 of 3 replicas in local DC must acknowledge). Balances durability with write latency (~2ms).

### Read Path

**Fetch conversation history:**
```cql
SELECT * FROM direct_messages
WHERE conversation_id = '100_200'
ORDER BY message_id DESC
LIMIT 50;
```

**Fetch unread messages on reconnect:**
```cql
SELECT * FROM direct_messages
WHERE conversation_id = ?
AND message_id > ?  -- last_seen_message_id
LIMIT 200;
```

### Interview Q&A

**Q: How do you handle the conversation_id for 1-on-1 chats?**
A: Sort both user IDs and concatenate: `min(user_a, user_b) + "_" + max(user_a, user_b)`. This ensures the same conversation has the same ID regardless of who initiates. For groups, use a UUID generated at group creation.

**Q: What's the Cassandra replication strategy?**
A: `NetworkTopologyStrategy` with replication factor 3 per datacenter. For a two-DC setup: 3 replicas in US-East, 3 in EU-West. Reads from local DC only (`LOCAL_QUORUM`) for low latency; failover to remote DC if local DC loses quorum.

**Q: How do you handle Cassandra hotspots for popular group chats?**
A: A group with 500 members all sending messages to the same `group_id` partition key creates a write hotspot. Mitigation: bucket by time — partition key becomes `(group_id, date)`. Each day is a new partition, distributing write load across Cassandra nodes over time.""",

    6: """## Session 6: Group Chat & Fan-out

### The Fan-out Problem

When User A sends a message to a 500-member group:
1. Message must be delivered to all 500 members
2. Some may be online (need real-time push), others offline (need queued delivery)
3. Read receipts for group messages are complex ("X of 500 have read this")

### Fan-out Strategies

**Strategy 1: Write fan-out (push model)**
- On send: write 500 individual inbox entries, one per group member
- Delivery: each Chat Server just reads its users' inboxes

Pros: Simple delivery (just read inbox). Cons: 500 writes per message → at 6K msg/sec with avg group size 20 = 120K writes/sec for group messages alone. For celebrity groups (500 members × 6K/sec) = 3M writes/sec → unsustainable.

**Strategy 2: Read fan-out (pull model)**
- On send: write only 1 message to group message store
- On read: each member fetches from group conversation

Pros: Single write per message. Cons: each client polls for new group messages → high read load + latency.

**Strategy 3: Hybrid fan-out (recommended)**
- Write 1 message to group message store (Cassandra `group_messages`)
- Publish single event to Kafka topic `group:{group_id}`
- **Online members**: Chat Servers subscribed to `group:{group_id}` topic push real-time via WebSocket
- **Offline members**: stored in Cassandra, fetched on reconnect

```mermaid
graph LR
    A([User A]) -->|send to group G| CS1[Chat Server 1]
    CS1 -->|INSERT| GM[(group_messages)]
    CS1 -->|publish| K[Kafka\ngroup:G topic]
    K -->|deliver| CS2[Chat Server 2]
    K -->|deliver| CS3[Chat Server 3]
    CS2 -->|push| B([User B - online])
    CS3 -->|push| C([User C - online])
    Note1[User D - offline:\nfetches from group_messages\non reconnect]
```

### Kafka Topic per Group vs. Single Topic

**Per-group topic:** `group:{group_id}` — clean isolation, easy to manage. But 1M groups = 1M Kafka topics (Kafka struggles above 100K topics).

**Single topic with group_id as key:** `group-messages` topic, partitioned by `group_id`. Consumers filter by their served users' groups. Better for Kafka scalability.

**Decision:** Single topic `group-messages`, partition by `group_id`, Chat Servers filter for their users' group subscriptions.

### Group Membership Management

```sql
-- PostgreSQL (relational data, low write volume)
CREATE TABLE group_members (
    group_id   UUID NOT NULL,
    user_id    BIGINT NOT NULL,
    role       VARCHAR(20) DEFAULT 'member',  -- 'admin', 'member'
    joined_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);
CREATE INDEX idx_gm_user ON group_members(user_id);
```

Cache group membership in Redis:
```
SMEMBERS group:{group_id}:members → set of user_ids
```

TTL: 5 minutes. When a user joins/leaves: update DB + invalidate Redis cache.

### Read Receipts at Scale

For 1-on-1: track `read_at` timestamp per message — simple.

For group (500 members): "X of 500 read" is expensive if stored per-user per-message.

**Practical approach:**
- Store `delivered_count` and `read_count` as counters on the message (COUNTER type in Cassandra)
- Don't store per-user read status (too expensive)
- For detailed "who read it" (admin feature only): store in a separate table with 24h TTL

```cql
CREATE TABLE message_receipts (
    message_id  TIMEUUID,
    user_id     BIGINT,
    status      TEXT,  -- 'delivered', 'read'
    timestamp   TIMESTAMP,
    PRIMARY KEY (message_id, user_id)
) WITH default_time_to_live = 86400;
```

### Interview Q&A

**Q: What's the maximum group size you'd support with this design?**
A: With hybrid fan-out, real-time delivery scales to ~1,000 members comfortably. Beyond that, consider "broadcast channels" (Telegram-style) where only admins send, limiting fan-out. For unlimited audience, shift to pure pull model with polling or SSE.

**Q: How do you prevent message ordering issues in group chats?**
A: Cassandra TIMEUUID ordering handles this at storage level. For real-time delivery, sequence numbers per group (stored in Redis, incremented atomically) detect gaps. Clients re-request missing sequence numbers from the API.""",

    7: """## Session 7: Presence System

### Requirements

- Show whether a contact is online or offline
- Show "last seen X minutes ago" for offline users
- Update presence within 5 seconds of status change
- Scale to 50M DAU with 10M simultaneous connections

### Architecture

```mermaid
graph TD
    Client([Mobile/Web Client])
    CS[Chat Server]
    PS[Presence Service]
    Redis[Redis\nPresence Store]
    Fanout[Presence Fan-out\nService]
    Kafka[Kafka\npresence-events]

    Client -->|WebSocket heartbeat every 30s| CS
    CS -->|online event| PS
    Client -->|WebSocket disconnect| CS
    CS -->|offline event| PS
    PS -->|SET user:{id}:status| Redis
    PS -->|publish| Kafka
    Kafka -->|consume| Fanout
    Fanout -->|notify friends online| CS
```

### Online Status Detection

**Heartbeat mechanism:**
- Client sends WebSocket ping every 30 seconds
- Chat Server updates presence: `SET user:{user_id}:presence {online, timestamp} EX 60`
- TTL = 60 seconds (2× heartbeat interval)
- If client crashes (no explicit disconnect): TTL expires after 60s → automatically "offline"

**Explicit disconnect:**
- Client sends `{type: "disconnect"}` message before closing
- OR Chat Server detects WebSocket close event
- Immediately set: `SET user:{user_id}:presence {offline, last_seen: now} EX 604800`

### Redis Presence Data Model

```
Key: user:{user_id}:presence
Value: {"status": "online", "last_seen": 1735689600, "device": "mobile"}
TTL: 60 seconds (refreshed every heartbeat)

Key: user:{user_id}:last_seen
Value: 1735689600  (Unix timestamp, permanent, updated on disconnect)
TTL: none (permanent)
```

### Presence Fan-out

When User A goes online, notify all of A's contacts who are currently online:

**Naive approach:** Fetch A's friends list (could be 5,000 friends), look up each friend's presence, push notification to each online friend's Chat Server. This is O(n) fan-out per status change.

**Problem:** If A has 5,000 friends and goes online/offline 10 times/day = 50,000 fan-out operations per user. At 50M DAU × 10 status changes = 500M fan-out events/day.

**Optimized approach:**
1. On status change: publish to Kafka `presence-events` topic
2. Presence Fan-out Service consumes events
3. Query A's online friends from Redis (only online friends need notification)
4. Fan out only to currently-online friends' Chat Servers

**Further optimization:** Clients subscribe to presence updates only for contacts they're actively viewing (chat list visible on screen). Background contacts don't need real-time updates — they get presence on-demand when chat is opened.

### Presence at Scale

**Problem:** 10M simultaneous connections × 30s heartbeat = 333K presence updates/sec hitting Redis.

**Solution: Hierarchical presence**
- Each Chat Server maintains in-memory presence for its connected users
- Redis stores only users whose presence needs cross-server visibility
- Chat Server publishes to Redis only on connect/disconnect (not heartbeat)
- Heartbeat resets in-memory timer on Chat Server — doesn't hit Redis

**Result:** Redis presence writes reduced from 333K/sec to ~20K/sec (connect/disconnect events only).

### Last Seen Privacy

Three privacy settings:
- **Everyone**: show exact "last seen 5 minutes ago"
- **Contacts**: only show to mutual contacts
- **Nobody**: show no last seen to anyone

Store privacy setting in user profile. Presence Fan-out Service checks privacy setting before sending presence notifications.

### Interview Q&A

**Q: What if a user has 3 devices? How do you track presence?**
A: Track per-device presence. User is "online" if any device is active. Store set of active device IDs: `SADD user:{id}:devices {device_id}`. On device disconnect: `SREM user:{id}:devices {device_id}`. User goes "offline" when set is empty.

**Q: How accurate is the 30-second heartbeat? Could there be ghost presence?**
A: Yes — if a mobile client enters a dead zone (no signal), the server won't receive the explicit disconnect. After 60 seconds (TTL), the user appears offline. This 60-second "ghost" window is an acceptable trade-off. Reducing TTL to 30s (1× heartbeat) tightens accuracy but creates edge cases where a heartbeat delay causes false offline.""",

    8: """## Session 8: Media & Notifications

### Image Upload Flow

Sending images through the Chat Server WebSocket would overload it — large binary payloads are not WebSocket's strength. Use a dedicated upload path:

```mermaid
sequenceDiagram
    participant A as User A
    participant AS as API Server
    participant S3 as S3 Object Storage
    participant CS as Chat Server
    participant B as User B

    A->>AS: POST /api/upload/presign {filename, size, type}
    AS->>S3: Generate presigned URL (15 min expiry)
    AS->>A: {upload_url: "s3.amazonaws.com/...", media_id: "img_abc"}
    A->>S3: PUT image directly to S3 (presigned URL)
    S3->>A: 200 OK (upload complete)
    A->>CS: WebSocket: send_message {type: "image", media_id: "img_abc", to: B}
    CS->>B: WebSocket push {type: "image", media_url: "cdn.example.com/img_abc"}
```

### S3 Configuration

- **Bucket**: `chat-media-{region}` with versioning disabled (images are immutable once uploaded)
- **Lifecycle policy**: Move to S3 Glacier after 1 year (cost optimization)
- **Presigned URL expiry**: 15 minutes — enough for upload, too short for abuse
- **Max file size**: 10MB (enforced by presigned URL policy)

### CDN for Image Delivery

Images served through CDN (CloudFront), not directly from S3:
- CDN edge delivers images with <50ms latency globally
- S3 origin bandwidth costs avoided
- URL format: `https://media.chat.example.com/{media_id}`

**Thumbnail generation:** On upload, Lambda function triggers and creates thumbnails:
- Preview thumbnail: 200×200 JPEG, quality 70 (for chat list)
- Full-size: original compressed (WebP, quality 80)

Store both in S3 at paths: `/{media_id}/thumb.jpg` and `/{media_id}/full.webp`.

### Push Notifications (Offline Users)

When User B is offline and receives a message:
1. Chat Server detects B is offline (connection registry shows no server)
2. Persists message to Cassandra
3. Sends push notification via notification service

```mermaid
graph LR
    CS[Chat Server] -->|offline user| NS[Notification Service]
    NS -->|iOS| APNS[Apple APNS]
    NS -->|Android| FCM[Google FCM]
    NS -->|Web| WPN[Web Push]
    APNS -->|deliver| iPhone([iPhone])
    FCM -->|deliver| Android([Android Phone])
```

**Notification payload:**
```json
{
  "to": "device_token_xyz",
  "notification": {
    "title": "User A",
    "body": "Hey, are you free?",
    "badge": 3
  },
  "data": {
    "conversation_id": "100_200",
    "message_id": "msg_123"
  }
}
```

Keep notification content minimal — the app fetches full message content from API on open.

### Notification Service Design

- **Retry logic**: If APNS/FCM returns transient failure, retry with exponential backoff (3 retries, 1s/5s/30s)
- **Batch**: Group multiple notifications for same device (user gets 5 messages while offline → 1 notification with badge count 5)
- **Rate limiting**: Max 10 notifications/minute per user (prevent spam)
- **Token management**: Store device tokens in `user_devices` table. On APNS 410 response: remove invalid token.

### End-to-End Encryption (Brief)

WhatsApp uses Signal Protocol (Double Ratchet Algorithm). High-level:
- Keys stored only on devices, never on server
- Server stores only encrypted ciphertext
- Key exchange happens via X3DH (Extended Triple Diffie-Hellman) on first message
- Server cannot decrypt messages — even under subpoena

This changes the architecture: server is a blind relay. Implications:
- Cassandra stores encrypted blobs, not plaintext
- Search within messages is impossible server-side
- Backup requires user-managed encryption keys

For this interview, acknowledge E2E as a design choice with these trade-offs; don't design the full cryptographic protocol.

### Interview Q&A

**Q: How do you handle notification when the user has multiple devices?**
A: Store all device tokens for a user: `user_devices` table with `(user_id, device_token, platform, last_active)`. Send notification to all active device tokens. The device that the user opens first marks the notification as read; the others clear the badge.

**Q: What if FCM/APNS is down?**
A: Notifications are best-effort — if the push gateway is down, the message is still persisted in Cassandra. When the user opens the app (even without a notification), the app connects via WebSocket and fetches unread messages. Notifications are convenience, not reliability guarantees.""",

    9: """## Session 9: Message Delivery Guarantees

### The Three Delivery Semantics

| Semantic | Definition | Risk |
|---|---|---|
| At-most-once | Send and forget | Messages can be lost |
| At-least-once | Retry until acknowledged | Messages can be duplicated |
| Exactly-once | No loss, no duplicate | Complex, expensive |

**Chat systems use at-least-once with client-side deduplication** — effectively achieving exactly-once UX without distributed transaction overhead.

### Message Acknowledgment Protocol

```mermaid
sequenceDiagram
    participant A as Sender
    participant CS as Chat Server
    participant DB as Cassandra
    participant B as Recipient

    A->>CS: {msg_id: "client_xyz", text: "Hi", to: B}
    Note over A: Start 5s ACK timer
    CS->>DB: INSERT message (msg_id, ...)
    CS->>A: {type: "ack", client_msg_id: "client_xyz", server_msg_id: "uuid_123"}
    Note over A: Timer cancelled
    CS->>B: {type: "message", server_msg_id: "uuid_123", text: "Hi"}
    B->>CS: {type: "delivered", server_msg_id: "uuid_123"}
    CS->>A: {type: "delivered", server_msg_id: "uuid_123"}
    B->>CS: {type: "read", server_msg_id: "uuid_123"}
    CS->>A: {type: "read", server_msg_id: "uuid_123"}
```

**Two message IDs:**
- `client_msg_id`: Generated by sender client (UUID4). Used to correlate ACK with pending message.
- `server_msg_id`: Generated by server (TIMEUUID). Used for all subsequent references.

### Sender Retry Logic

If sender doesn't receive ACK within 5 seconds:
```
retry 1: wait 5s, resend with same client_msg_id
retry 2: wait 10s, resend
retry 3: wait 30s, resend
give up: mark message as "failed" in UI
```

Server handles duplicates: `INSERT ... IF NOT EXISTS` on `client_msg_id` uniqueness constraint. Second attempt returns existing `server_msg_id` — idempotent.

### Delivery Receipt Flow

**Delivered status**: Server → sender when Chat Server successfully pushes to recipient's WebSocket connection.

**Read status**: Recipient client → Chat Server when message appears on screen (not just received).

**Group messages**: Delivered when delivered to all online members. Read when recipient explicitly opens the chat.

### Message Ordering Guarantees

**Per-conversation ordering** via TIMEUUID:
- Monotonically increasing within each Cassandra partition (conversation_id)
- Clock skew between clients handled: server assigns TIMEUUID at receipt time, not sender's clock

**Cross-conversation ordering**: Not guaranteed — messages in different conversations may appear in different order on different clients. This is acceptable.

**Sequence numbers** for gap detection:
```
Each conversation has a sequence counter in Redis.
Server increments counter on each message: INCR conv:{conv_id}:seq
Sequence number stored with message in Cassandra.
Client detects gaps: if received seq=5 but expected seq=4, fetch missing message.
```

### Handling the "Last Mile" Problem

Server has persisted the message and sent it to the recipient's Chat Server. The Chat Server pushes via WebSocket. Three failure scenarios:

1. **WebSocket push succeeds**: Recipient receives message. Chat Server publishes delivery receipt.
2. **WebSocket push fails (buffer full)**: Chat Server retries after 1s. Recipient's client buffers. Marks as "delivered" after 3 retries or explicit ACK.
3. **Recipient disconnects during push**: No ACK received. Message remains `delivered=false` in Cassandra. On reconnect, recipient fetches all undelivered messages.

### Duplicate Detection (Client Side)

Client maintains a `received_message_ids` set (LRU, last 1,000 IDs) in memory:
```python
def handle_incoming(message):
    if message.server_msg_id in received_ids:
        return  # duplicate, ignore
    received_ids.add(message.server_msg_id)
    render_message(message)
    send_delivered_receipt(message.server_msg_id)
```

### Interview Q&A

**Q: How do you guarantee messages are never lost even if Cassandra is temporarily unavailable?**
A: Kafka acts as the durability buffer. Messages are published to Kafka before the Chat Server sends the sender ACK. Kafka retains messages for 7 days. Even if Cassandra is down for hours, the Kafka consumer catches up on recovery and writes all messages to Cassandra. The sender receives ACK only after Kafka commit — so from the sender's perspective, the message is "safe" once ACKed.

**Q: WhatsApp shows single tick (sent), double tick (delivered), blue tick (read). How do you implement this efficiently?**
A: Three separate events published to Kafka: `message_sent` (when server persists), `message_delivered` (when recipient's Chat Server pushes), `message_read` (when recipient opens chat). Each event updates the sender's UI via WebSocket. These events are lightweight (just `{type, server_msg_id, timestamp}`) — not the full message.""",

    10: """## Session 10: Mock Interview

### Full Interview Simulation (45 Minutes)

**Interviewer:** "Design WhatsApp — the core messaging features."

---

**[Minutes 0-5: Requirements]**

**Candidate:** "Core features to confirm: 1-on-1 messaging, group chat, online presence, message history. What's the group size limit?"

**Interviewer:** "500 members max."

**Candidate:** "Media — images only, or video too?"

**Interviewer:** "Images only for now."

**Candidate:** "Scale — DAU?"

**Interviewer:** "50 million DAU."

**Candidate:** "Non-functional: message delivery under 500ms when both online. High availability — messages must never be lost. Global deployment? Or single region?"

**Interviewer:** "Global — users in US, EU, Asia."

**Candidate:** "Got it. Out of scope: voice/video calls, payments, user authentication system."

---

**[Minutes 5-10: Capacity Estimation]**

**Candidate:** "50M DAU, peak concurrent 20% = 10M connections. Messages: 100M/day = ~1,200/sec, peak 6,000/sec.

Storage: 100M messages × 200 bytes = 20GB/day. 5 years = 36TB. Need Cassandra.

Images: assume 10% of messages = 10M images/day × 500KB = 5TB/day → S3.

Connections: 10M WebSockets, each server holds 100K → need 100 Chat Servers."

---

**[Minutes 10-20: High-Level Architecture]**

**Candidate:** "I'll split into three main paths: connection management, message routing, and storage.

Connection path: Client connects via WebSocket to a Chat Server. Load balancer uses consistent hashing by user_id for sticky sessions. 100 Chat Servers handle 10M connections.

Message routing: When A (on Server 1) sends to B (on Server 47), Server 1 checks Redis connection registry to find B's server. Publishes message to Kafka. Server 47 consumes from Kafka, pushes to B.

Storage: Messages persist to Cassandra before ACK is sent to sender. Image uploads go directly to S3 via presigned URLs; CDN serves images to recipients."

**Interviewer:** "Why not have Chat Servers communicate directly instead of through Kafka?"

**Candidate:** "Direct communication creates an N² connection mesh — 100 servers × 100 peers = 10,000 connections to maintain. Kafka is a hub: each server connects to Kafka only. Also, Kafka provides message replay and durability. If Chat Server 47 crashes, messages queue in Kafka and the replacement server consumes them on restart."

---

**[Minutes 20-30: Deep Dive — Offline Delivery]**

**Interviewer:** "Walk me through what happens when B is offline."

**Candidate:** "Server 1 looks up B in connection registry → no entry → B is offline. Message is persisted to Cassandra with `delivered = false`. Notification Service sends a push notification via APNS/FCM to B's registered device token.

When B reconnects: B's client opens WebSocket to a Chat Server (let's say Server 82). Server 82 registers B in connection registry. Then queries Cassandra for all messages where B is recipient and `delivered = false`, ordered by TIMEUUID ascending. Delivers all missed messages to B's WebSocket. B's client sends `delivered` receipt for each. Server updates Cassandra and notifies senders."

**Interviewer:** "What if B has been offline for 30 days and has 10,000 missed messages?"

**Candidate:** "Fetch in batches of 200 messages. Client paginates. Also, implement a 30-day retention for delivery — after 30 days of non-delivery, messages are still stored (1-year TTL) but we stop attempting delivery notifications. User can still scroll back and see them manually."

---

**[Minutes 30-40: Failure Modes]**

**Interviewer:** "What happens when a Chat Server crashes mid-message?"

**Candidate:** "Three scenarios. First: crash before Cassandra write — sender's ACK timer fires after 5 seconds, client retries with same `client_msg_id`. Server processes as new message (idempotent insert). Second: crash after Cassandra write but before sender ACK — same retry path, but second attempt finds existing message (via `IF NOT EXISTS`) and returns existing server_msg_id. No duplicate. Third: crash after sender ACK but before recipient delivery — Kafka message hasn't been acknowledged. On Chat Server recovery (or rebalance to another server), Kafka redelivers the message."

**Interviewer:** "What about the presence system at 50M DAU?"

**Candidate:** "Heartbeat every 30 seconds per client. 10M active connections × (1/30) = 333K presence updates/sec if we hit Redis every heartbeat. That's too heavy. Optimization: Chat Servers manage presence in-memory. Only on connect/disconnect do they write to Redis. Heartbeats reset the in-memory timer (60s TTL). Redis sees ~20K writes/sec — manageable. Presence fan-out is further limited: only notify friends currently active in the app, not all friends."

---

**[Minutes 40-45: Scaling to 10x]**

**Interviewer:** "How does your design scale to 500M DAU?"

**Candidate:** "Main bottlenecks to address: Connections: 100M simultaneous → 1,000 Chat Servers. Kafka: increase partitions to 500, scale brokers to 50. Cassandra: scale from 30 to 300 nodes. Redis: shard connection registry across 100 Redis nodes.

Multi-region becomes critical: US, EU, Asia each get a full deployment. Messages within a region stay regional — low latency. Cross-region: route through regional backbone. Eventual consistency across regions is acceptable for chat.

CDN for images becomes even more critical — 50TB/day of image traffic needs aggressive edge caching."

---

### Key Trade-offs to Articulate

| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| Protocol | WebSocket | Long polling | Real-time bidirectional, low latency |
| Message store | Cassandra | PostgreSQL | High write throughput, time-series fit |
| Routing | Kafka hub | Direct server mesh | N² complexity, Kafka adds durability |
| Delivery | At-least-once + dedup | Exactly-once | Exactly-once needs distributed transactions |
| Presence | 30s heartbeat | Event-driven | Balance accuracy vs. Redis write load |"""
}

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json') as f:
    data = json.load(f)

topic = data[1]  # Chat System
sessions = topic['plan']['sessions']
updated = 0
for s in sessions:
    snum = s['session']
    if snum in SESSIONS:
        s['content'] = SESSIONS[snum]
        updated += 1
        print(f"  Session {snum}: {s['title']}")

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

print(f"\nDone. Updated {updated} sessions for {topic['topic']}")
