#!/usr/bin/env python3
"""Part 3: Chat System (WhatsApp/Slack) — all 10 sessions"""
import json

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json"

with open(PATH) as f:
    data = json.load(f)

idx = next(i for i, d in enumerate(data) if "Chat System" in d["topic"])
sessions = data[idx]["plan"]["sessions"]

CONTENT = {
1: """## Session 1: Requirements & Scope

A chat system is one of the most complex system design problems. It touches real-time communication, message ordering, presence, and delivery guarantees. Start by aggressively scoping.

### Opening the Interview

**Interviewer:** "Design a chat system like WhatsApp."

**Candidate:** "There's a lot to cover here. Let me ask some clarifying questions to scope this properly. Are we building 1:1 messaging, group chats, or both? Do we need real-time delivery or is email-like delay acceptable? Do we need message history? What about features like read receipts, typing indicators, and online presence?"

---

### Functional Requirements (Agreed Scope)

After negotiating with the interviewer:

1. **1:1 messaging:** Send and receive messages between two users
2. **Group messaging:** Up to 500 members per group
3. **Online presence:** Show online/offline status
4. **Message delivery receipts:** Sent, Delivered, Read indicators
5. **Push notifications:** For offline users
6. **Message history:** Persistent, accessible across devices
7. **Media:** Text only for now (mention media as extension)

**Out of scope for this interview:** End-to-end encryption, voice/video calls, message editing, reactions, threads.

---

### Non-Functional Requirements

| Requirement | Target | Reasoning |
|---|---|---|
| Message delivery | < 100ms P99 | Real-time feel requires sub-second |
| Availability | 99.99% | Users cannot send messages during outage |
| Ordering | Total order within conversation | Messages must not arrive out of order |
| Durability | No message loss | Even if recipient is offline |
| Scale | 2B users, 100B messages/day | WhatsApp scale |
| Message size | 64KB max text | Standard limit |

---

### Scale Estimation

```
Users: 2 billion registered, 500 million daily active
Messages per day: 100 billion
Messages per second: 100B / 86,400 = 1.16 million msgs/sec
Peak (3x): ~3.5 million msgs/sec

Average message size: 1KB (with metadata)
Storage per day: 100B * 1KB = 100 TB/day
Storage per year: ~36 PB
```

**Candidate:** "At 1.2 million messages per second, this is one of the highest-throughput systems I'd design. Every architectural decision — database choice, connection management, message routing — needs to be justified at this scale."

---

### The Core Challenge: Real-Time Delivery

**Interviewer:** "What's the hardest part of this system?"

**Candidate:** "Real-time delivery. HTTP is request-response — the client asks, the server answers. But chat is push-based: the server needs to push messages to clients without the client asking. There are three options:

1. **Short polling:** Client polls every X seconds — terrible for battery and latency
2. **Long polling:** Client holds connection open, server responds when message arrives — better but wasteful
3. **WebSockets:** Bidirectional persistent connection — industry standard for chat

I'll use WebSockets for the real-time channel. Each client maintains one WebSocket connection to a chat server. When Alice sends a message to Bob, it flows: Alice's client → Alice's chat server → message queue → Bob's chat server → Bob's client."
""",

2: """## Session 2: Capacity Estimation

### Message Traffic

```
Daily Active Users: 500M
Messages sent per user per day: 40
Total messages: 500M * 40 = 20B/day
Messages per second: 20B / 86,400 ≈ 231,000 msg/sec
Peak (3x): 700,000 msg/sec

Group messages (fan-out):
  Assume 10% of messages go to groups of avg 50 members
  Fan-out messages: 231,000 * 0.1 * 50 = 1.155M deliveries/sec
  Total delivery events: ~1.4M/sec
```

### WebSocket Connections

```
DAU: 500M
Concurrent online at peak: 500M * 0.2 = 100M connections
Connections per chat server: 65,000 (OS file descriptor limit with tuning)
Chat servers needed: 100M / 65,000 = ~1,540 servers

Memory per connection: ~10KB (WebSocket state, buffers)
Total memory: 100M * 10KB = 1TB (across 1,540 servers, 650MB each)
```

**This is why WhatsApp runs on Erlang (Elixir):** The BEAM VM was designed for millions of lightweight processes. A single Erlang node can hold 1M+ WebSocket connections with far less memory than Python or Java.

### Storage

```
Per message record:
  message_id:   16 bytes (UUID)
  sender_id:    8 bytes
  receiver_id:  8 bytes (user or group)
  content:      avg 500 bytes (text)
  timestamp:    8 bytes
  status:       1 byte
  ────────────────────
  Total:        ~550 bytes

Daily storage:
  20B messages * 550 bytes = 11 TB/day

With 3x replication: 33 TB/day
Retention: 5 years = 33 * 365 * 5 ≈ 60 PB

Media (not in scope but worth mentioning):
  If 10% of messages have 50KB attachments:
  2B * 50KB = 100 TB/day additional
```

### Presence Updates

```
Online status changes (login/logout/heartbeat):
  500M DAU * (avg session: 3 login events) = 1.5B events/day
  1.5B / 86,400 = 17,000 presence updates/sec

Per user's friend list: avg 200 contacts
Fan-out per presence update: 200 notifications
Total presence notifications: 17,000 * 200 = 3.4M/sec
```

**Interview insight:** "Presence at scale is surprisingly expensive — 3.4 million fan-out events per second just for online status. Facebook's solution was to reduce update frequency and use approximate presence — 'Active 5 minutes ago' rather than real-time."
""",

3: """## Session 3: API Design

Chat systems use multiple protocols: REST for setup, WebSocket for real-time, and a push notification protocol for offline delivery.

### REST APIs

**Send Message (fallback for offline senders):**
```http
POST /v1/messages
Content-Type: application/json
Authorization: Bearer {token}

{
  "conversation_id": "conv_abc123",
  "content": "Hey, are you free tonight?",
  "content_type": "text",
  "client_message_id": "client_uuid_xyz"  // idempotency key
}
```

Response:
```json
{
  "message_id": "msg_789",
  "conversation_id": "conv_abc123",
  "status": "sent",
  "server_timestamp": "2024-01-15T10:30:00.123Z",
  "sequence_number": 4521
}
```

**Get Message History:**
```http
GET /v1/conversations/{conv_id}/messages?before=msg_789&limit=50
```

Response uses cursor-based pagination:
```json
{
  "messages": [...],
  "cursor": "msg_739",
  "has_more": true
}
```

### WebSocket Protocol

WebSocket messages are JSON frames with a `type` field:

```typescript
// Client → Server: Send message
{
  "type": "MESSAGE_SEND",
  "payload": {
    "conversation_id": "conv_abc123",
    "content": "Hey!",
    "client_message_id": "client_uuid_xyz",
    "timestamp": 1705312800123
  }
}

// Server → Client: Message delivered to recipient
{
  "type": "MESSAGE_NEW",
  "payload": {
    "message_id": "msg_789",
    "conversation_id": "conv_abc123",
    "sender_id": "user_456",
    "content": "Hey!",
    "timestamp": 1705312800150,
    "sequence_number": 4521
  }
}

// Server → Client: Receipt update
{
  "type": "RECEIPT_UPDATE",
  "payload": {
    "message_id": "msg_789",
    "status": "read",
    "updated_at": 1705312810000
  }
}

// Client → Server: Typing indicator
{
  "type": "TYPING_START",
  "payload": {
    "conversation_id": "conv_abc123"
  }
}

// Client → Server: Heartbeat (keep-alive)
{
  "type": "PING",
  "payload": { "timestamp": 1705312800000 }
}

// Server → Client: Heartbeat response
{
  "type": "PONG",
  "payload": { "timestamp": 1705312800001 }
}
```

### Python WebSocket Handler

```python
import asyncio
import websockets
import json
from dataclasses import dataclass

@dataclass
class Connection:
    user_id: str
    websocket: websockets.WebSocketServerProtocol
    last_ping: float

class ChatServer:
    def __init__(self):
        self.connections: dict[str, Connection] = {}  # user_id -> connection

    async def handle_connection(self, websocket, path):
        user_id = await self.authenticate(websocket)
        if not user_id:
            await websocket.close(code=4001, reason="Unauthorized")
            return

        conn = Connection(user_id=user_id, websocket=websocket, last_ping=time.time())
        self.connections[user_id] = conn

        # Notify presence system
        await presence_service.set_online(user_id, server_id=SERVER_ID)

        try:
            async for raw_message in websocket:
                await self.handle_message(user_id, raw_message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            del self.connections[user_id]
            await presence_service.set_offline(user_id)

    async def handle_message(self, sender_id: str, raw: str):
        msg = json.loads(raw)
        msg_type = msg.get("type")

        if msg_type == "MESSAGE_SEND":
            await self.process_send(sender_id, msg["payload"])
        elif msg_type == "TYPING_START":
            await self.process_typing(sender_id, msg["payload"])
        elif msg_type == "PING":
            await self.send_to(sender_id, {"type": "PONG", "payload": {}})

    async def process_send(self, sender_id: str, payload: dict):
        # Save to database
        message = await message_store.save({
            "sender_id": sender_id,
            "conversation_id": payload["conversation_id"],
            "content": payload["content"],
            "client_message_id": payload["client_message_id"],
        })

        # Deliver to recipients
        recipients = await conversation_service.get_members(payload["conversation_id"])
        for recipient_id in recipients:
            if recipient_id == sender_id:
                continue
            await delivery_service.deliver(recipient_id, message)

    async def send_to(self, user_id: str, frame: dict):
        conn = self.connections.get(user_id)
        if conn:
            await conn.websocket.send(json.dumps(frame))
```

### TypeScript Client

```typescript
class ChatClient {
  private ws: WebSocket | null = null
  private messageHandlers: Map<string, (payload: unknown) => void> = new Map()
  private reconnectDelay = 1000

  connect(token: string): void {
    this.ws = new WebSocket(`wss://chat.example.com/ws?token=${token}`)

    this.ws.onopen = () => {
      console.log('Connected')
      this.reconnectDelay = 1000  // reset backoff
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      const frame = JSON.parse(event.data)
      const handler = this.messageHandlers.get(frame.type)
      if (handler) handler(frame.payload)
    }

    this.ws.onclose = () => {
      // Exponential backoff reconnect
      setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
        this.connect(token)
      }, this.reconnectDelay)
    }
  }

  sendMessage(conversationId: string, content: string): string {
    const clientMessageId = crypto.randomUUID()
    this.ws?.send(JSON.stringify({
      type: 'MESSAGE_SEND',
      payload: { conversation_id: conversationId, content, client_message_id: clientMessageId }
    }))
    return clientMessageId  // for optimistic UI
  }

  on(type: string, handler: (payload: unknown) => void): void {
    this.messageHandlers.set(type, handler)
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.ws?.send(JSON.stringify({ type: 'PING', payload: { timestamp: Date.now() } }))
    }, 30000)
  }
}
```
""",

4: """## Session 4: Database Schema

Chat systems need two fundamentally different storage patterns: fast message writes/reads (primary store) and efficient history retrieval (archival). They often use different databases for each.

### Database Choice

**Interviewer:** "Which database would you use for messages?"

**Candidate:** "Messages have a specific access pattern: write-heavy (millions/second), read by conversation with time-ordering, and rarely updated. This maps perfectly to Apache Cassandra:

1. **Write throughput:** Cassandra's LSM-tree storage handles millions of writes/second across a cluster
2. **Partitioning:** Partition by conversation_id — all messages for a conversation on same node, fast sequential reads
3. **Time ordering:** Cassandra supports clustering keys with ORDER BY — natural for message history
4. **Availability:** Cassandra's peer-to-peer architecture with tunable consistency has no single point of failure

For user metadata and conversation records, PostgreSQL works well — low write volume, complex queries needed."

### Cassandra Schema for Messages

```sql
-- Cassandra CQL (not standard SQL)
CREATE KEYSPACE chat WITH replication = {
    'class': 'NetworkTopologyStrategy',
    'us-east': 3,
    'eu-west': 3
};

-- Primary message storage
CREATE TABLE messages (
    conversation_id UUID,
    message_id      TIMEUUID,        -- TimeUUID = timestamp + UUID, naturally ordered
    sender_id       UUID,
    content         TEXT,
    content_type    VARCHAR,         -- 'text', 'image', 'video'
    status          TINYINT,         -- 0=sent, 1=delivered, 2=read
    client_msg_id   UUID,            -- idempotency
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC)
  AND compaction = {'class': 'TimeWindowCompactionStrategy',
                    'compaction_window_unit': 'DAYS',
                    'compaction_window_size': 7};

-- Index for idempotency check
CREATE TABLE messages_by_client_id (
    client_msg_id   UUID,
    message_id      TIMEUUID,
    conversation_id UUID,
    PRIMARY KEY (client_msg_id)
) WITH default_time_to_live = 86400;  -- 24hr TTL (idempotency window)
```

**Why TIMEUUID?** TimeUUID encodes the timestamp in the UUID itself. When used as a Cassandra clustering key, messages are automatically ordered by time. No separate `created_at` column needed for ordering.

### PostgreSQL Schema for Metadata

```sql
-- Users
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    phone_number    VARCHAR(20) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    last_seen       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(10) NOT NULL,  -- 'direct' or 'group'
    name            VARCHAR(200),           -- for group chats
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    last_message_id TEXT
);

CREATE INDEX idx_conversations_last_message
    ON conversations(last_message_at DESC);

-- Conversation members
CREATE TABLE conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role            VARCHAR(20) NOT NULL DEFAULT 'member',  -- 'admin', 'member'
    last_read_at    TIMESTAMPTZ,  -- for unread count calculation
    PRIMARY KEY (conversation_id, user_id)
);

-- Index for "get all conversations for user" query
CREATE INDEX idx_members_user_id
    ON conversation_members(user_id, last_read_at DESC);

-- Message delivery receipts (separate from message content)
CREATE TABLE message_receipts (
    message_id      TEXT NOT NULL,
    recipient_id    BIGINT NOT NULL,
    delivered_at    TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    PRIMARY KEY (message_id, recipient_id)
);
```

### Redis Schema for Presence & Routing

```
# User presence
Key: presence:{user_id}
Value: {status: "online", server_id: "chat-server-42", last_seen: 1705312800}
TTL: 30 seconds (refreshed by heartbeat)

# Server routing: which server holds user's WebSocket
Key: ws_server:{user_id}
Value: "chat-server-42"
TTL: 30 seconds

# Unread message count per conversation
Key: unread:{user_id}:{conversation_id}
Value: integer count
Type: Redis INCR (atomic)

# Online user set (for group presence)
Key: online_users
Type: Redis Sorted Set
Member: {user_id}
Score: {unix_timestamp}  -- for "last seen" ordering
```

### Message Sequence Numbers

**Problem:** How do clients know if they missed a message?

```sql
-- Per-conversation sequence counter (PostgreSQL)
CREATE TABLE conversation_sequences (
    conversation_id UUID PRIMARY KEY,
    last_sequence   BIGINT NOT NULL DEFAULT 0
);

-- Atomic increment to get next sequence number
UPDATE conversation_sequences
SET last_sequence = last_sequence + 1
WHERE conversation_id = $1
RETURNING last_sequence;
```

Messages include their sequence number. Clients track the last received sequence. Gap = missed message → request re-delivery.
""",

5: """## Session 5: High-Level Architecture

### Full System Diagram

```mermaid
graph TB
    subgraph Clients
        Mobile[Mobile App]
        Web[Web Browser]
    end

    subgraph Edge
        LB[Load Balancer]
        GW[API Gateway]
    end

    subgraph ChatServers ["Chat Server Cluster (1,540 servers)"]
        CS1[Chat Server 1]
        CS2[Chat Server 2]
        CSN[Chat Server N]
    end

    subgraph Routing
        MQ[Message Queue<br/>Kafka]
        RS[Router Service<br/>Redis Pub/Sub]
    end

    subgraph Storage
        Cass[(Cassandra<br/>Messages)]
        PG[(PostgreSQL<br/>Metadata)]
        Redis[(Redis<br/>Presence/Cache)]
        S3[(S3<br/>Media)]
    end

    subgraph Push
        PN[Push Notification<br/>Service]
        APNS[Apple APNs]
        FCM[Google FCM]
    end

    Mobile & Web --> LB
    LB --> GW
    GW --> CS1 & CS2 & CSN
    CS1 & CS2 & CSN --> MQ
    CS1 & CS2 & CSN --> RS
    MQ --> CS1 & CS2 & CSN
    MQ --> PN
    CS1 & CS2 & CSN --> Cass
    CS1 & CS2 & CSN --> PG
    CS1 & CS2 & CSN --> Redis
    PN --> APNS & FCM
```

### Message Flow: Alice sends to Bob

```mermaid
sequenceDiagram
    participant A as Alice (Client)
    participant CS1 as Chat Server 1 (Alice's)
    participant Kafka
    participant Redis
    participant CS2 as Chat Server 2 (Bob's)
    participant B as Bob (Client)
    participant PN as Push Notification

    A->>CS1: WebSocket: MESSAGE_SEND {to: Bob, content: "Hey!"}
    CS1->>Cassandra: INSERT message (async)
    CS1->>Kafka: publish to topic "messages"
    CS1-->>A: ACK {message_id, sequence_number}

    Kafka->>CS1: consume (fan-out worker)

    Note over CS1,Redis: Find which server Bob is on
    CS1->>Redis: GET ws_server:bob_id
    Redis-->>CS1: "chat-server-2"

    CS1->>CS2: gRPC: DeliverMessage {message}

    alt Bob is online
        CS2->>B: WebSocket: MESSAGE_NEW {message}
        B-->>CS2: WebSocket: RECEIPT {delivered}
        CS2->>CS1: gRPC: ReceiptUpdate
        CS1->>A: WebSocket: RECEIPT_UPDATE {delivered}
    else Bob is offline
        CS2->>PN: Push notification to Bob's device
        PN->>FCM: FCM push
        FCM->>B: Device notification
    end
```

### Key Architecture Decisions

**Why Kafka between chat servers?**

"Kafka decouples the sender's chat server from the delivery process. Without Kafka, Chat Server 1 would need to directly call Chat Server 2. If CS2 is down, the message is lost. With Kafka, the message is durably stored. CS2 consumes from Kafka when it comes back up. We also get fan-out: for group messages, one Kafka message triggers delivery to all group members via consumer groups."

**Why gRPC between chat servers (not REST)?**

"gRPC uses HTTP/2 with persistent connections and protobuf serialization. It's 5-10x faster than REST for server-to-server communication. In a cluster of 1,540 servers with millions of messages/second flowing between them, this matters."

**Why Redis Pub/Sub for presence notifications?**

"When Bob comes online, we need to notify all of Bob's contacts who are also online. Redis Pub/Sub lets us publish to a channel `presence:bob` and have all interested servers subscribe. This is more efficient than having every server query for Bob's contacts."

### Group Message Fan-Out

The hardest scaling challenge: a message to a 500-member group generates 499 delivery events.

```mermaid
graph LR
    Msg[Group Message<br/>500 members] --> K[Kafka Topic<br/>group-messages]
    K --> W1[Fan-out Worker 1<br/>members 1-100]
    K --> W2[Fan-out Worker 2<br/>members 101-200]
    K --> W3[Fan-out Worker 3<br/>members 201-300]
    K --> W4[Fan-out Worker 4<br/>members 301-400]
    K --> W5[Fan-out Worker 5<br/>members 401-500]
```

Workers partition the member list and deliver in parallel. A 500-member group message is delivered in parallel batches, not sequentially.

**Interviewer:** "What about a group with 10,000 members?"

**Candidate:** "At that scale, fan-out-on-write becomes expensive. For very large groups (100+ members), I'd switch to a pull model: the message is written once to storage, and clients pull recent messages on connect or wake-up. WhatsApp actually limits groups to 1,024 members partly for this reason. Slack and Discord handle large channels differently — they show 'X new messages' and paginate, rather than delivering each message in real-time to every member."
""",

6: """## Session 6: Deep Dive — Message Ordering & Delivery Guarantees

Message ordering is the subtle correctness challenge that separates junior from senior candidates.

### The Problem: Total Order in Distributed Systems

```
Scenario:
  Alice sends: "How are you?" at t=1000ms
  Alice sends: "Let's meet!" at t=1001ms

Problem without ordering:
  Bob sees: "Let's meet!" then "How are you?"
  This is confusing and wrong.

Root cause:
  Alice's two messages go to different Kafka partitions.
  Different partitions have no ordering guarantee.
  Bob's chat server delivers whichever Kafka message arrives first.
```

### Solution 1: Single Kafka Partition per Conversation

```python
# Producer: always use conversation_id as Kafka partition key
producer.produce(
    topic="messages",
    key=conversation_id.encode(),  # same conversation → same partition → ordered
    value=message_json.encode()
)
```

**Guarantees:** Messages within a conversation are strictly ordered (Kafka partition ordering guarantee).

**Problem:** A single partition can handle ~100MB/s. A viral conversation (millions of messages/second) would be a hot partition bottleneck.

**Mitigation:** Limit group sizes (WhatsApp's 1024 limit), or use sub-partitioning for very active conversations.

### Solution 2: Client-Side Sequence Numbers

Even with Kafka ordering, network issues can cause messages to arrive out of order at the client. The authoritative fix: server-assigned monotonic sequence numbers.

```python
class ConversationSequencer:
    def __init__(self, redis):
        self.redis = redis

    async def get_next_sequence(self, conversation_id: str) -> int:
        \"\"\"Atomically increment and return next sequence number.\"\"\"
        return await self.redis.incr(f"seq:{conversation_id}")

# In message handler:
async def save_message(conversation_id: str, content: str, sender_id: str) -> dict:
    seq = await sequencer.get_next_sequence(conversation_id)
    message = {
        "message_id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "content": content,
        "sequence_number": seq,
        "timestamp": int(time.time() * 1000)
    }
    await cassandra.execute(
        "INSERT INTO messages (conversation_id, message_id, sender_id, content, seq_num) VALUES (?, ?, ?, ?, ?)",
        [conversation_id, uuid.uuid1(), sender_id, content, seq]
    )
    return message
```

**Client-side ordering:**

```typescript
class MessageOrderBuffer {
  private pending: Map<number, Message> = new Map()
  private nextExpected = 1

  receive(message: Message): void {
    this.pending.set(message.sequenceNumber, message)
    this.flush()
  }

  private flush(): void {
    while (this.pending.has(this.nextExpected)) {
      const msg = this.pending.get(this.nextExpected)!
      this.pending.delete(this.nextExpected)
      this.nextExpected++
      this.displayMessage(msg)  // only display in order
    }
  }
}
```

### Exactly-Once Delivery

The three delivery semantics:

| Semantic | Behavior | Risk |
|---|---|---|
| At-most-once | Deliver, don't retry | Message loss |
| At-least-once | Retry until ACK | Duplicate messages |
| Exactly-once | Deliver exactly once | Complex, expensive |

**We use:** At-least-once with idempotency on the receiver side.

```python
class MessageDeliveryService:
    async def deliver(self, recipient_id: str, message: dict) -> bool:
        delivery_key = f"delivered:{message['message_id']}:{recipient_id}"

        # Idempotency check: already delivered?
        already_delivered = await redis.get(delivery_key)
        if already_delivered:
            return True  # Skip duplicate

        # Attempt delivery
        conn = self.get_connection(recipient_id)
        if conn:
            await conn.send(message)
            await redis.setex(delivery_key, 86400, "1")  # mark delivered, 24hr TTL
            return True
        else:
            # User offline — queue for push notification
            await push_queue.enqueue(recipient_id, message)
            return False
```

### The client_message_id (Idempotency Key)

**Problem:** Client sends message, network drops before receiving ACK. Client retries. Server gets duplicate.

```python
async def process_send(sender_id: str, payload: dict) -> dict:
    client_msg_id = payload['client_message_id']

    # Check idempotency table (24hr window)
    existing = await db.fetchrow(
        "SELECT message_id FROM messages_by_client_id WHERE client_msg_id = ?",
        client_msg_id
    )
    if existing:
        # Duplicate detected — return original result
        return {"message_id": existing['message_id'], "status": "already_sent"}

    # First time — process normally
    message = await save_and_deliver(sender_id, payload)
    return {"message_id": message['message_id'], "status": "sent"}
```

### Message Status State Machine

```mermaid
stateDiagram-v2
    [*] --> Sending : Client taps Send
    Sending --> Sent : Server ACK received
    Sending --> Failed : Timeout / No ACK
    Failed --> Sending : User retries
    Sent --> Delivered : Recipient's device ACK
    Delivered --> Read : Recipient opens conversation
    Read --> [*]
```

**Implementation:**

```python
async def update_message_status(message_id: str, recipient_id: str, status: str):
    # Update in PostgreSQL
    await pg.execute(
        \"\"\"INSERT INTO message_receipts (message_id, recipient_id, delivered_at, read_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (message_id, recipient_id) DO UPDATE
           SET delivered_at = COALESCE(EXCLUDED.delivered_at, message_receipts.delivered_at),
               read_at = COALESCE(EXCLUDED.read_at, message_receipts.read_at)\"\"\",
        message_id, recipient_id,
        datetime.utcnow() if status == "delivered" else None,
        datetime.utcnow() if status == "read" else None
    )

    # Notify sender via WebSocket
    sender_id = await get_message_sender(message_id)
    await deliver_to_user(sender_id, {
        "type": "RECEIPT_UPDATE",
        "payload": {"message_id": message_id, "status": status}
    })
```
""",

7: """## Session 7: Deep Dive — Presence System & Push Notifications

### Presence Architecture

Showing who is online is deceptively hard at scale. At 500M DAU with 200 contacts each, a naive approach generates 100 billion presence queries.

### Heartbeat-Based Presence

```python
# Client sends heartbeat every 30 seconds while active
# Server sets presence in Redis with 60-second TTL

class PresenceService:
    HEARTBEAT_TTL = 60  # seconds
    HEARTBEAT_INTERVAL = 30  # client sends every 30s

    async def heartbeat(self, user_id: str, server_id: str):
        \"\"\"Called on each WebSocket message or explicit ping.\"\"\"
        key = f"presence:{user_id}"
        await redis.setex(key, self.HEARTBEAT_TTL, json.dumps({
            "status": "online",
            "server_id": server_id,
            "last_seen": int(time.time())
        }))

        # Update last_seen in DB (throttled — max once per 5 minutes)
        throttle_key = f"last_seen_update:{user_id}"
        if not await redis.exists(throttle_key):
            await redis.setex(throttle_key, 300, "1")
            await db.execute(
                "UPDATE users SET last_seen = NOW() WHERE id = $1",
                user_id
            )

    async def get_presence(self, user_id: str) -> dict:
        data = await redis.get(f"presence:{user_id}")
        if data:
            return {**json.loads(data), "status": "online"}
        # Not in Redis — check DB for last_seen
        row = await db.fetchrow("SELECT last_seen FROM users WHERE id = $1", user_id)
        return {"status": "offline", "last_seen": row["last_seen"].isoformat()}

    async def get_bulk_presence(self, user_ids: list[str]) -> dict:
        \"\"\"Efficient bulk presence check using Redis pipeline.\"\"\"
        pipe = redis.pipeline()
        for uid in user_ids:
            pipe.get(f"presence:{uid}")
        results = await pipe.execute()

        presence = {}
        for uid, result in zip(user_ids, results):
            if result:
                data = json.loads(result)
                presence[uid] = {"status": "online", **data}
            else:
                presence[uid] = {"status": "offline"}
        return presence
```

### Presence Fan-Out Problem

**Problem:** Alice has 500 contacts. When Alice comes online, all online contacts should be notified. But we can't query which of 500 users are currently online and on which server.

**Solution: Redis Pub/Sub for presence broadcasting**

```python
async def on_user_online(user_id: str):
    # Publish to a presence channel
    await redis.publish(f"presence_updates", json.dumps({
        "user_id": user_id,
        "status": "online",
        "timestamp": int(time.time())
    }))

# On each chat server — subscribe and fan-out to connected clients who care
async def presence_subscriber():
    pubsub = redis.pubsub()
    await pubsub.subscribe("presence_updates")

    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        update = json.loads(message["data"])
        updated_user = update["user_id"]

        # Find all local connections whose contacts include updated_user
        # (this is the key optimization: each server only delivers to its own connections)
        for local_user_id, conn in local_connections.items():
            contacts = await contact_cache.get_contacts(local_user_id)
            if updated_user in contacts:
                await conn.websocket.send(json.dumps({
                    "type": "PRESENCE_UPDATE",
                    "payload": update
                }))
```

**Optimization:** Cache each user's contact list in Redis. `contact_cache.get_contacts(user_id)` → O(1) Redis lookup, not a DB query.

### Approximate Presence: The Facebook Approach

At extreme scale, exact real-time presence is too expensive. Facebook's approach:

1. **Bucket users by activity:** "Active now" (< 5 min), "Active today", "Active this week"
2. **Coarse-grained updates:** Only notify when user crosses a bucket boundary
3. **Lazy evaluation:** Don't push presence — let clients poll when they open a conversation

This reduces presence traffic by ~95% with minimal UX impact.

### Push Notifications for Offline Users

```python
class PushNotificationService:
    async def send(self, user_id: str, message: dict):
        device_tokens = await self.get_device_tokens(user_id)
        if not device_tokens:
            return

        for token in device_tokens:
            platform = token["platform"]  # "ios" or "android"
            if platform == "ios":
                await self.send_apns(token["token"], message)
            elif platform == "android":
                await self.send_fcm(token["token"], message)

    async def send_apns(self, token: str, message: dict):
        # Apple Push Notification Service
        payload = {
            "aps": {
                "alert": {
                    "title": message["sender_name"],
                    "body": message["content"][:100]  # truncate for notification
                },
                "badge": await self.get_unread_count(message["recipient_id"]),
                "sound": "default"
            },
            "data": {
                "conversation_id": message["conversation_id"],
                "message_id": message["message_id"]
            }
        }
        # Send via APNs HTTP/2 API...

    async def send_fcm(self, token: str, message: dict):
        # Firebase Cloud Messaging
        payload = {
            "to": token,
            "notification": {
                "title": message["sender_name"],
                "body": message["content"][:100]
            },
            "data": {
                "conversation_id": message["conversation_id"]
            }
        }
        # Send via FCM API...
```

### Rate-Limiting Push Notifications

**Problem:** A noisy group chat could send 1,000 notifications to a user in an hour — causing notification fatigue and battery drain.

```python
async def send_with_rate_limit(user_id: str, message: dict):
    # Allow at most 5 push notifications per minute per conversation
    rate_key = f"push_rate:{user_id}:{message['conversation_id']}"
    count = await redis.incr(rate_key)
    if count == 1:
        await redis.expire(rate_key, 60)

    if count <= 5:
        await push_service.send(user_id, message)
    else:
        # Silently batch — user will see count badge update
        await redis.incr(f"unread:{user_id}:{message['conversation_id']}")
```
""",

8: """## Session 8: Scaling & Bottlenecks

### Scaling WebSocket Connections

**The core challenge:** HTTP servers are stateless, but WebSockets are stateful. A user's connection is pinned to one chat server. How do you scale?

```mermaid
graph TD
    subgraph Problem
        LB1[Load Balancer] --> CS1a[Chat Server 1<br/>Alice connected]
        LB1 --> CS2a[Chat Server 2<br/>Bob connected]
        CS1a -->|"How does CS1 reach Bob?"| CS2a
    end
```

**Solution: Service mesh with Redis routing**

```python
class MessageRouter:
    async def route_to_user(self, recipient_id: str, message: dict) -> bool:
        # Look up which server holds recipient's WebSocket
        server_info = await redis.get(f"ws_server:{recipient_id}")

        if not server_info:
            # User offline
            return False

        data = json.loads(server_info)
        server_id = data["server_id"]

        if server_id == MY_SERVER_ID:
            # Deliver locally
            conn = local_connections.get(recipient_id)
            if conn:
                await conn.websocket.send(json.dumps(message))
                return True
        else:
            # Forward to correct server via gRPC
            stub = self.get_stub(server_id)
            await stub.DeliverMessage(DeliverRequest(
                recipient_id=recipient_id,
                message=json.dumps(message)
            ))
            return True

        return False
```

### Horizontal Scaling: From 100 to 10,000 Chat Servers

```
Scaling chat servers is straightforward because each server is:
  - Stateless in business logic
  - State only in: which WebSocket connections it holds

Kubernetes deployment:
  apiVersion: apps/v1
  kind: Deployment
  spec:
    replicas: 1540  # auto-scaled by HPA
    template:
      spec:
        containers:
        - name: chat-server
          resources:
            limits:
              memory: "2Gi"  # 65,000 connections × 30KB = ~2GB
```

**Server reconnection on failover:**

When a chat server crashes, all its WebSocket connections drop. Clients detect `onclose` and reconnect with exponential backoff:

```typescript
// Client reconnect with exponential backoff
let reconnectDelay = 1000
const MAX_DELAY = 30000

ws.onclose = () => {
  setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 1.5 + Math.random() * 1000, MAX_DELAY)
    reconnect()
  }, reconnectDelay)
}
```

The `Math.random() * 1000` (jitter) prevents all clients from reconnecting simultaneously — the "thundering herd" problem.

### Cassandra Scaling

```
Cassandra cluster sizing:
  100B messages/day × 550 bytes = 55 TB/day writes
  With 3x replication factor: 165 TB/day total writes

Node sizing (i3.4xlarge: 3.8TB NVMe, 100MB/s write throughput):
  Writes per node: 165 TB/day / 86,400 = 1.9 GB/sec across cluster
  At 100MB/s per node: 19 nodes minimum, run 25 for headroom

Read replicas for history load:
  Message history reads are less frequent than writes
  Cassandra's LOCAL_QUORUM ensures reading from nearest replica
  Consistency level: LOCAL_ONE for message history (eventually consistent ok)
```

### The "Hot Conversation" Problem

A single celebrity conversation or viral group chat can create a Cassandra hot partition.

**Solution: Write spreading with synthetic partition keys**

```python
NUM_BUCKETS = 10  # split hot conversation across 10 partitions

def get_partition_key(conversation_id: str, message_id: str) -> str:
    bucket = hash(message_id) % NUM_BUCKETS
    return f"{conversation_id}#{bucket}"

# Write:
async def save_message(conversation_id: str, message: dict):
    partition_key = get_partition_key(conversation_id, message["message_id"])
    await cassandra.execute(
        "INSERT INTO messages (conversation_id, ...) VALUES (?, ...)",
        [partition_key, ...]
    )

# Read: must query all buckets and merge
async def get_messages(conversation_id: str, limit: int = 50) -> list:
    queries = [
        cassandra.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY message_id DESC LIMIT ?",
            [f"{conversation_id}#{b}", limit]
        )
        for b in range(NUM_BUCKETS)
    ]
    all_results = await asyncio.gather(*queries)
    # Merge and sort by timestamp
    merged = sorted(
        [msg for result in all_results for msg in result],
        key=lambda m: m.message_id,
        reverse=True
    )
    return merged[:limit]
```

### Kafka Scaling for Fan-Out

```
Group message fan-out at scale:
  100K groups × avg 100 members = 10M delivery events per group message batch
  At peak: 10M events/sec through Kafka

Kafka cluster sizing:
  Each partition: ~100MB/s throughput
  100MB/s × 200 partitions = 20 GB/s total
  At avg 1KB message size: 20M msgs/sec capacity

Consumer groups for fan-out workers:
  topic: group_messages
  consumer group: fan_out_workers (50 worker instances)
  Each worker handles 4 partitions
  Fan-out parallelism: 200 partitions × 50 workers
```
""",

9: """## Session 9: Edge Cases & Failure Modes

### Edge Case 1: Message Ordering Across Devices

Alice logs into WhatsApp on her phone, sends a message, then opens WhatsApp Web. The Web client must show the same message history in the same order.

**Solution: Multi-device sync via server-side sequence numbers**

```python
async def sync_messages(user_id: str, device_id: str, last_seen_seq: int):
    \"\"\"Return all messages since device's last sync point.\"\"\"
    # Get all conversations the user is in
    conversations = await db.fetch(
        "SELECT conversation_id FROM conversation_members WHERE user_id = $1",
        user_id
    )

    sync_data = {}
    for conv in conversations:
        conv_id = conv["conversation_id"]
        # Get messages the device hasn't seen
        messages = await cassandra.execute(
            \"\"\"SELECT * FROM messages
               WHERE conversation_id = ?
               AND seq_num > ?
               ORDER BY seq_num ASC
               LIMIT 100\"\"\",
            [conv_id, last_seen_seq]
        )
        if messages:
            sync_data[conv_id] = messages

    return sync_data
```

### Edge Case 2: Offline Message Storage

When Bob is offline, Alice's message must be stored and delivered when Bob comes online.

```python
class OfflineMessageQueue:
    async def enqueue(self, recipient_id: str, message: dict):
        \"\"\"Store message for offline delivery.\"\"\"
        queue_key = f"offline_queue:{recipient_id}"
        # Store in Redis sorted set (score = timestamp for ordering)
        await redis.zadd(queue_key, {
            json.dumps(message): message["timestamp"]
        })
        # 30-day retention
        await redis.expire(queue_key, 30 * 86400)

    async def flush_on_connect(self, user_id: str, websocket) -> int:
        \"\"\"Deliver all queued messages when user connects.\"\"\"
        queue_key = f"offline_queue:{user_id}"
        messages = await redis.zrange(queue_key, 0, -1, withscores=False)
        if not messages:
            return 0

        for raw_msg in messages:
            msg = json.loads(raw_msg)
            await websocket.send(json.dumps({
                "type": "MESSAGE_NEW",
                "payload": msg
            }))

        await redis.delete(queue_key)
        return len(messages)
```

### Edge Case 3: Network Partition Between Chat Servers

**Scenario:** The network between Chat Server 1 (Alice) and Chat Server 2 (Bob) is partitioned. Alice sends a message; it reaches Kafka but CS2 cannot consume it.

```mermaid
sequenceDiagram
    participant A as Alice → CS1
    participant K as Kafka
    participant CS2 as CS2 (Bob)

    A->>K: message published ✓
    K->>CS2: deliver message ✗ (network partition)
    Note over K: Kafka retains message
    Note over CS2: Partition heals
    K->>CS2: retry delivery ✓
    CS2->>A: Bob is now online, send queued messages ✓
```

Kafka's durability means the message survives the partition. When CS2 reconnects, it continues consuming from where it left off. **This is why Kafka is essential** — it's the buffer that bridges server failures.

### Edge Case 4: Duplicate Message Display

**Problem:** Alice sends "Hello", network retries, server delivers twice, Bob sees "Hello Hello".

**Layered defense:**

```python
# Layer 1: Client-side deduplication by message_id
class ClientMessageStore:
    def __init__(self):
        self.seen_ids: set[str] = set()
        self.messages: list[Message] = []

    def add(self, message: Message) -> bool:
        if message.id in self.seen_ids:
            return False  # Duplicate — discard
        self.seen_ids.add(message.id)
        self.messages.append(message)
        return True

# Layer 2: Server-side idempotency by client_message_id (covered in Session 6)

# Layer 3: Database unique constraint
CREATE UNIQUE INDEX idx_messages_client_id
ON messages(client_message_id);  -- DB rejects duplicate inserts
```

### Failure Mode 1: Chat Server Crash Mid-Delivery

```
Timeline:
  t=0: Alice sends message
  t=1: CS1 saves to Cassandra ✓
  t=2: CS1 publishes to Kafka ✓
  t=3: CS1 crashes (before sending ACK to Alice)
  t=4: Alice's client reconnects to CS3 (new server)
  t=5: Alice retries send (client_message_id = same)
  t=6: CS3 checks idempotency table → message already exists → returns original result
  t=7: Message delivered to Bob via Kafka consumer ✓
```

The combination of: Kafka durability + idempotency keys + Cassandra persistence means no message loss even on server crash.

### Failure Mode 2: Cascading Presence Updates

**Problem:** A celebrity with 50M followers comes online. 50M presence notifications generated simultaneously → Redis overwhelmed.

**Solution: Presence update rate limiting + fan-out sampling**

```python
async def broadcast_presence(user_id: str, status: str):
    follower_count = await get_follower_count(user_id)

    if follower_count < 10_000:
        # Small account: full fan-out
        await full_presence_fanout(user_id, status)
    elif follower_count < 1_000_000:
        # Medium account: fan-out only to online followers
        online_followers = await get_online_followers(user_id)
        await partial_presence_fanout(user_id, status, online_followers)
    else:
        # Celebrity: no real-time fan-out
        # Followers see presence lazily when they open the conversation
        await update_presence_store_only(user_id, status)
```

### Edge Case 5: Message Read Receipts in Groups

**Problem:** In a 500-member group, who has read a message? Showing "Read by 347 of 500" requires tracking 500 receipts per message.

```python
class GroupReadReceiptService:
    async def mark_read(self, user_id: str, conversation_id: str, last_read_msg_id: str):
        # Update member's last_read pointer
        await db.execute(
            \"\"\"UPDATE conversation_members
               SET last_read_at = NOW(), last_read_msg_id = $3
               WHERE user_id = $1 AND conversation_id = $2\"\"\",
            user_id, conversation_id, last_read_msg_id
        )

    async def get_read_count(self, message_id: str, conversation_id: str) -> int:
        # Count members whose last_read_msg_id >= this message
        row = await db.fetchrow(
            \"\"\"SELECT COUNT(*) as read_count
               FROM conversation_members cm
               JOIN messages m ON m.sequence_number <= (
                   SELECT sequence_number FROM messages WHERE message_id = $1
               )
               WHERE cm.conversation_id = $2
               AND cm.last_read_msg_id IS NOT NULL\"\"\",
            message_id, conversation_id
        )
        return row["read_count"]
```

**WhatsApp's approach:** For group chats, WhatsApp shows double checkmarks (delivered to group) but does NOT show individual read status for each group member — this is a deliberate UX and scale simplification.
""",

10: """## Session 10: Mock Interview — Chat System

**Interviewer:** "Design WhatsApp. 45 minutes."

**Candidate:** "Let me ask a few scoping questions first. Do we need 1:1 only, or group chats? What about voice and video — in or out of scope? Do we need end-to-end encryption? And what's the target scale — hundreds of millions of users?"

**Interviewer:** "1:1 and groups up to 500. No voice/video. Skip E2E encryption for now. Target: 500 million daily active users."

**Candidate:** "Got it. Let me estimate the scale: 500M DAU, each sends 40 messages/day, gives 20B messages/day — roughly 230,000 messages/second average, 700,000 at peak. Each message needs to be delivered in under 100ms. The read:write ratio depends on group size — for a 100-member group, one write generates 99 reads. So this is a fan-out heavy system."

*[Draws architecture on whiteboard]*

**Candidate:** "The core challenge is real-time delivery. HTTP doesn't work — it's request-response. I'll use WebSockets: each client maintains a persistent bidirectional connection to a chat server. At 500M DAU with 20% concurrent, that's 100M simultaneous WebSocket connections across roughly 1,500 servers."

**Interviewer:** "How does a message from Alice get to Bob if they're on different chat servers?"

**Candidate:** "Three-step process. First: Alice's message hits her chat server. The server saves it to Cassandra for durability and publishes it to Kafka. Second: A fan-out worker consumes from Kafka and looks up which server holds Bob's WebSocket — this routing info is in Redis with a 30-second TTL refreshed by heartbeats. Third: The worker sends the message to Bob's chat server via gRPC, which pushes it to Bob's WebSocket. If Bob is offline, the fan-out worker sends a push notification via APNs or FCM instead."

**Interviewer:** "Why Cassandra instead of PostgreSQL?"

**Candidate:** "The message access patterns: write-heavy at 230K writes/second, and reads are always by conversation ordered by time. Cassandra's LSM-tree storage is optimized for high-throughput writes. Its partition-by-conversation_id, cluster-by-message_id scheme means message history reads are sequential — exactly what Cassandra excels at. I'd use PostgreSQL for the lower-volume metadata: users, conversation membership, and settings."

**Interviewer:** "How do you guarantee message ordering?"

**Candidate:** "Two layers. First: I use conversation_id as the Kafka partition key. All messages in a conversation go to the same partition, maintaining Kafka's strict ordering guarantee. Second: the server assigns a monotonic sequence number to each message, stored in a Redis counter. The client tracks the last received sequence number. If it receives sequence 47 after 45, it knows it missed 46 and requests re-delivery. This handles edge cases like network reordering between servers."

**Interviewer:** "What happens when a chat server crashes?"

**Candidate:** "Let me trace through it. Kafka has already durably stored any messages in flight — so no message loss. The WebSocket connections to the crashed server drop. Clients detect onclose and reconnect to a different chat server with exponential backoff plus jitter. The new server registers the user's presence in Redis, replacing the old entry. When the Kafka consumer for the crashed server's assignments is rebalanced to surviving consumers, message delivery resumes. Total impact: 1-5 seconds of reconnect delay for affected users, zero message loss."

**Interviewer:** "How does the online presence system work at this scale?"

**Candidate:** "Presence is expensive because of fan-out. When Alice comes online, potentially millions of her contacts should be notified. My approach: each client sends a heartbeat every 30 seconds. The chat server sets a Redis key with a 60-second TTL. If the key expires, the user is considered offline. For fan-out, I use Redis Pub/Sub — when Alice comes online, her server publishes to a presence channel. Every chat server subscribes, and each delivers presence updates only to its locally connected clients who have Alice as a contact. This avoids cross-server round-trips. For celebrity users with millions of followers, I use lazy presence — show the status only when someone opens Alice's conversation, not as a pushed event."

**Interviewer:** "Last question — how would you handle the case where a user sends a message and immediately loses connectivity before getting the ACK?"

**Candidate:** "The client assigns a client_message_id — a client-generated UUID — before sending. This UUID is the idempotency key. When the user reconnects and retries, the server checks the idempotency table in Cassandra. If the client_message_id already exists, it means the first send succeeded despite the dropped ACK. The server returns the original message_id and the client de-duplicates. The message is delivered exactly once to Bob. The client_message_id has a 24-hour TTL — after that, a retry is treated as a new message."

**Interviewer:** "Great. That covers everything well."

---

### Key Differentiators in This Answer

- Named Kafka partition key strategy for ordering
- Explained exactly why Cassandra beats PostgreSQL for this workload
- Traced crash recovery step by step, covering Kafka rebalancing
- Quantified presence fan-out cost and gave celebrity account optimization
- Explained idempotency keys without being prompted
""",
}

for session in sessions:
    snum = session["sessionNumber"]
    if snum in CONTENT:
        session["content"] = CONTENT[snum]

with open(PATH, "w") as f:
    json.dump(data, f, separators=(",", ":"))

print(f"Updated {len(CONTENT)} sessions for Chat System")
