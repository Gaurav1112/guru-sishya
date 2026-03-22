import json

MQ_CONTENT = {
    1: """## Why Async? The Producer-Consumer Pattern

Imagine you walk into a coffee shop and order a latte. In a **synchronous** world, you'd stand frozen at the counter, unable to move, speak, or think until the barista hands you the cup. In the **asynchronous** world — the real one — you get a number, step aside, and go check your phone. The barista works at their own pace. You work at yours. Neither blocks the other.

This is exactly the problem message queues solve in software systems.

### The Synchronous Problem

In a typical web request, your API server calls downstream services synchronously:

```
User → API Server → Email Service → (blocks) → Response
```

If the Email Service is slow (or down), your user waits. If it crashes, your request fails. If you get 10,000 sign-ups simultaneously, your Email Service gets 10,000 simultaneous calls and collapses.

```mermaid
sequenceDiagram
    participant U as User
    participant A as API Server
    participant E as Email Service
    U->>A: POST /register
    A->>E: sendWelcomeEmail()
    Note over A,E: API blocks waiting...
    E-->>A: 200 OK (3 seconds later)
    A-->>U: 201 Created
```

### The Async Solution: Message Queues

With a message queue, the API server drops a message into the queue and immediately responds to the user. The Email Service picks it up whenever it's ready.

```mermaid
sequenceDiagram
    participant U as User
    participant A as API Server
    participant Q as Message Queue
    participant E as Email Service
    U->>A: POST /register
    A->>Q: publish(user_registered_event)
    A-->>U: 201 Created (immediate!)
    Note over Q,E: Later, independently...
    Q->>E: deliver(user_registered_event)
    E->>E: sendWelcomeEmail()
```

### Core Vocabulary

- **Producer**: The component that creates and publishes messages (your API server)
- **Consumer**: The component that reads and processes messages (your Email Service)
- **Broker**: The intermediary that stores and routes messages (SQS, Kafka, RabbitMQ)
- **Queue**: A buffer that holds messages until a consumer processes them
- **Message**: A payload — typically JSON — describing an event or command

### Three Powers of Async Decoupling

**1. Resilience**: If the Email Service goes down for an hour, messages accumulate safely in the queue. When it comes back up, it processes the backlog. No emails are lost. Without a queue, those sign-ups would have gotten errors.

**2. Load leveling**: Black Friday sends 50,000 orders per minute. Your Order Processing Service can only handle 5,000 per minute. With a queue, orders pile up safely and are processed at a sustainable rate. Without it, the service crashes.

**3. Loose coupling**: The API server doesn't know (or care) that an Email Service exists. You can add an SMS service, a fraud detection service, or an analytics pipeline without touching the producer at all.

### Real-World Example: Amazon

When you place an order on Amazon, the checkout service doesn't synchronously call inventory, payments, fraud detection, shipping, and notifications. It publishes a single `OrderPlaced` event to a queue. Dozens of downstream services consume that event independently. This is why Amazon can process millions of orders per day without the checkout page timing out.

### When NOT to Use Async

Async isn't always the answer. Use synchronous calls when:
- You need the result immediately to continue (e.g., checking if a username is available)
- Strong consistency is required (e.g., payment authorization)
- The operation is fast and always available

Use async when: the operation is slow, can fail, is non-critical to the immediate response, or needs to fan out to multiple systems.

### Key Takeaway

The producer-consumer pattern trades immediacy for resilience and scale. It decouples services in time and space — neither the producer nor consumer needs to be available simultaneously. This is the foundational mental model for every message queue system you'll encounter.
""",

    2: """## Pub/Sub Pattern: One Event, Many Listeners

In the previous session, we saw how a queue connects one producer to one consumer. But what if a single event needs to trigger multiple independent actions? That's where **Publish-Subscribe (Pub/Sub)** comes in.

### Point-to-Point vs Pub/Sub

**Point-to-Point (Queue)**: One producer, one consumer. Each message is delivered to exactly one consumer. Think of it like direct mail — one letter goes to one recipient.

**Pub/Sub (Topic)**: One producer publishes to a topic, and any number of subscribers receive a copy. Think of it like a newspaper — one printing, thousands of readers.

```mermaid
graph TD
    P[Producer<br/>Order Service] --> T[Topic<br/>order.placed]
    T --> C1[Consumer 1<br/>Inventory Service]
    T --> C2[Consumer 2<br/>Notification Service]
    T --> C3[Consumer 3<br/>Analytics Service]
    T --> C4[Consumer 4<br/>Fraud Detection]
```

### The E-Commerce Order Example

When a customer places an order, at least four things need to happen:
1. Reserve inventory
2. Send confirmation email
3. Record the sale for analytics
4. Run fraud checks

In a synchronous world, the Order Service calls all four sequentially — slow and brittle. With Pub/Sub:

```python
# Producer: Order Service
event = {
    "event_type": "order.placed",
    "order_id": "ord-9821",
    "user_id": "usr-4421",
    "items": [{"sku": "SHOE-42", "qty": 1, "price": 89.99}],
    "total": 89.99,
    "timestamp": "2024-01-15T10:30:00Z"
}
sns_client.publish(TopicArn=ORDER_TOPIC_ARN, Message=json.dumps(event))
# Returns immediately. Done.
```

Each downstream service subscribes independently and processes the event in its own way, at its own pace.

### Event Schema Design

A good event schema answers: **what happened, to what, when, and with what data?**

```json
{
  "event_type": "order.placed",       // What happened
  "event_id": "evt-uuid-here",        // Unique ID for deduplication
  "aggregate_id": "ord-9821",         // What entity this is about
  "timestamp": "2024-01-15T10:30:00Z",// When
  "version": "1.0",                   // Schema version for evolution
  "payload": {                        // The data
    "user_id": "usr-4421",
    "items": [...],
    "total": 89.99
  }
}
```

Always include `event_id` for idempotency — if a consumer receives the same event twice (network retry), it can detect and skip duplicates.

### Adding a New Subscriber: Zero Producer Changes

The killer feature of Pub/Sub is **open/closed principle at the infrastructure level**. Six months after launch, your data team wants to stream orders into a data warehouse. With Pub/Sub:

1. Data team creates a new consumer service
2. Subscribes to the `order.placed` topic
3. Done — the Order Service code is never touched

Without Pub/Sub, adding a new downstream means modifying the Order Service, retesting it, and redeploying it. With Pub/Sub, the producer is completely unaware of who is listening.

### Fan-Out Architecture (AWS)

In AWS, SNS (pub/sub) + SQS (queue) is a classic pattern:

```mermaid
graph LR
    P[Order Service] --> SNS[SNS Topic<br/>order-events]
    SNS --> SQS1[SQS Queue<br/>inventory-queue]
    SNS --> SQS2[SQS Queue<br/>notification-queue]
    SNS --> SQS3[SQS Queue<br/>analytics-queue]
    SQS1 --> C1[Inventory Service]
    SQS2 --> C2[Email Service]
    SQS3 --> C3[Analytics Service]
```

Each service gets its own queue, so a slow Analytics Service doesn't block the Inventory Service. Each queue can have its own retry policy, DLQ, and scaling.

### Choreography: The Double-Edged Sword

Pub/Sub enables **choreography** — services react to events without a central coordinator. This is powerful but can create invisible dependencies. If five services all react to `order.placed`, you have an implicit contract. Change the event schema and suddenly five services break.

Always version your event schemas and maintain backward compatibility.

### Real-World: Netflix

Netflix uses pub/sub extensively for its recommendation engine. When you finish watching a show (a `playback.completed` event), it fans out to: update your watch history, adjust recommendations, update Continue Watching, record analytics, trigger the next-episode suggestion. All from a single event. All independent. All async.

### Key Takeaway

Pub/Sub enables one-to-many event broadcasting without coupling the producer to its consumers. It's the backbone of event-driven architectures and makes systems extensible — adding new behavior means adding a new subscriber, not modifying existing code.
""",

    3: """## Dead Letter Queues and Error Handling

In production, messages fail. A consumer throws an unhandled exception. The database is temporarily unavailable. A malformed message arrives that your code can't parse. What happens to that message?

Without a strategy, you have two terrible options: silently drop it (data loss) or retry forever (system lockup). **Dead Letter Queues (DLQs)** give you a third path: quarantine failing messages for investigation while keeping the main queue healthy.

### What is a Dead Letter Queue?

A DLQ is a secondary queue that receives messages that couldn't be successfully processed after a configured number of attempts. It's a safety net — nothing is lost, but the main queue isn't blocked.

```mermaid
graph LR
    P[Producer] --> Q[Main Queue]
    Q --> C[Consumer]
    C -->|Success| Done[Processed ✓]
    C -->|Failure attempt 1| Q
    C -->|Failure attempt 2| Q
    C -->|Failure attempt 3 - max reached| DLQ[Dead Letter Queue]
    DLQ --> Alert[Alert / Investigation]
```

### SQS DLQ Configuration

```python
# Create the DLQ first
dlq = sqs.create_queue(QueueName='orders-dlq')
dlq_arn = sqs.get_queue_attributes(
    QueueUrl=dlq['QueueUrl'],
    AttributeNames=['QueueArn']
)['Attributes']['QueueArn']

# Create main queue with redrive policy
main_queue = sqs.create_queue(
    QueueName='orders-processing',
    Attributes={
        'RedrivePolicy': json.dumps({
            'deadLetterTargetArn': dlq_arn,
            'maxReceiveCount': '3'  # Move to DLQ after 3 failures
        }),
        'VisibilityTimeout': '30'   # 30 seconds to process before retry
    }
)
```

### The Visibility Timeout Mechanism

SQS doesn't delete a message when a consumer reads it — it hides it (visibility timeout). If the consumer processes it successfully, it calls `delete_message`. If the consumer crashes or times out, the message reappears in the queue and another consumer picks it up.

```mermaid
sequenceDiagram
    participant Q as Queue
    participant C as Consumer
    Q->>C: deliver(message) [hidden for 30s]
    Note over C: Consumer crashes
    Note over Q: 30s timeout expires
    Q->>C: re-deliver(message) [attempt 2]
    Note over C: Consumer crashes again
    Q->>C: re-deliver(message) [attempt 3]
    Note over C: maxReceiveCount=3 reached
    Q->>DLQ: move to Dead Letter Queue
```

### Poison Pill Messages

A **poison pill** is a message that always causes the consumer to crash — usually due to malformed data, an unexpected schema, or a bug triggered by specific input. Without a DLQ, the consumer crashes, the message reappears, the consumer crashes again, forever.

```python
# Consumer with proper error handling
def process_message(message):
    try:
        body = json.loads(message['Body'])
        process_order(body)
        sqs.delete_message(
            QueueUrl=QUEUE_URL,
            ReceiptHandle=message['ReceiptHandle']
        )
    except json.JSONDecodeError as e:
        # Malformed JSON — will go to DLQ after max retries
        logger.error(f"Invalid JSON in message: {e}", extra={"message_id": message['MessageId']})
        # Do NOT delete — let it fail and eventually reach DLQ
    except TransientError as e:
        # Temporary failure — retry makes sense
        logger.warning(f"Transient error, will retry: {e}")
        # Do NOT delete — visibility timeout will cause retry
```

### Exponential Backoff

For transient failures (database temporarily overloaded), immediate retries make things worse. Use exponential backoff:

```python
import time, random

def retry_with_backoff(fn, max_retries=5):
    for attempt in range(max_retries):
        try:
            return fn()
        except TransientError:
            if attempt == max_retries - 1:
                raise
            wait = (2 ** attempt) + random.uniform(0, 1)  # jitter
            time.sleep(wait)
            # Waits: ~1s, ~2s, ~4s, ~8s, ~16s
```

The jitter (random component) prevents the **thundering herd** problem — if 1,000 consumers all fail at the same time and retry with identical backoff, they all hammer the database again simultaneously.

### Processing the DLQ

The DLQ isn't a trash bin — it's a repair queue. After fixing the bug:

```python
# Replay DLQ messages back to main queue after fixing the bug
def replay_dlq():
    while True:
        messages = sqs.receive_message(QueueUrl=DLQ_URL, MaxNumberOfMessages=10)
        if 'Messages' not in messages:
            break
        for msg in messages['Messages']:
            sqs.send_message(QueueUrl=MAIN_QUEUE_URL, MessageBody=msg['Body'])
            sqs.delete_message(QueueUrl=DLQ_URL, ReceiptHandle=msg['ReceiptHandle'])
```

### Alerting on DLQ Depth

Set a CloudWatch alarm: if DLQ message count > 0, page the on-call engineer. A non-empty DLQ always means something needs investigation.

### Key Takeaway

DLQs make failure visible and recoverable. They protect the main queue from poison pills, give you a place to investigate failures, and let you replay messages after fixing bugs. Never build a production queue consumer without one.
""",

    4: """## Kafka Core Concepts: Topics, Partitions, and Consumer Groups

Apache Kafka is not just a message queue — it's a distributed, append-only log. Understanding this distinction is the key to understanding why Kafka can handle millions of events per second while providing strong durability guarantees.

### The Fundamental Data Structure: The Log

Kafka stores messages in an **ordered, immutable log**. Messages are appended to the end and never modified. Consumers read by tracking their position (offset) in the log.

```
Offset:  0    1    2    3    4    5    6    7    8 ...
         [msg][msg][msg][msg][msg][msg][msg][msg][msg]
                          ^
                   Consumer at offset 4
```

This is fundamentally different from a traditional queue where consumed messages are deleted. In Kafka, messages are retained for a configurable period (e.g., 7 days), regardless of whether they've been consumed. This enables **replay** — go back to offset 0 and reprocess everything.

### Topics and Partitions

A **topic** is a named stream of messages (e.g., `order-events`, `user-clicks`). Each topic is split into **partitions** — independent, ordered logs that can live on different brokers.

```mermaid
graph TD
    T[Topic: order-events<br/>3 partitions]
    T --> P0[Partition 0<br/>Broker 1]
    T --> P1[Partition 1<br/>Broker 2]
    T --> P2[Partition 2<br/>Broker 3]
    P0 --> M0["[ord-1][ord-4][ord-7]"]
    P1 --> M1["[ord-2][ord-5][ord-8]"]
    P2 --> M2["[ord-3][ord-6][ord-9]"]
```

Partitions are how Kafka achieves parallelism and scale. More partitions = more consumers can read in parallel = higher throughput.

### Partition Keys: Controlling Message Routing

When producing a message, you specify a **key**. Kafka hashes the key to determine which partition the message goes to. Messages with the same key always go to the same partition — guaranteeing order for that key.

```python
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    key_serializer=lambda k: k.encode('utf-8')
)

# All messages for order-9821 go to the same partition
producer.send(
    topic='order-events',
    key='order-9821',          # Partition key — ensures ordering per order
    value={
        'event': 'order.placed',
        'order_id': 'order-9821',
        'total': 89.99
    }
)
producer.flush()
```

### Consumer Groups: Parallel Processing

A **consumer group** is a set of consumers that cooperate to process a topic. Kafka assigns each partition to exactly one consumer in the group at any time. This is how you horizontally scale consumption.

```mermaid
graph LR
    T[Topic: order-events<br/>3 partitions]
    P0[Partition 0] --> C1[Consumer 1]
    P1[Partition 1] --> C2[Consumer 2]
    P2[Partition 2] --> C3[Consumer 3]
    C1 & C2 & C3 --> CG[Consumer Group:<br/>order-processors]
```

If you add a 4th consumer to a 3-partition topic, that consumer sits idle — there's no partition for it. If you remove Consumer 2, Kafka **rebalances**: Consumer 1 or Consumer 3 takes over Partition 1.

```python
from kafka import KafkaConsumer

consumer = KafkaConsumer(
    'order-events',
    bootstrap_servers=['localhost:9092'],
    group_id='order-processors',       # Consumer group ID
    auto_offset_reset='earliest',      # Start from beginning if no committed offset
    enable_auto_commit=False,          # Manual commit for at-least-once guarantees
    value_deserializer=lambda v: json.loads(v.decode('utf-8'))
)

for message in consumer:
    try:
        process_order(message.value)
        consumer.commit()              # Only commit after successful processing
    except Exception as e:
        logger.error(f"Failed to process: {e}")
        # Don't commit — message will be redelivered
```

### Replication: Durability

Each partition has a **replication factor** — copies on multiple brokers. One copy is the **leader** (handles reads/writes), others are **followers** (replicate synchronously).

```
Partition 0:  Broker 1 (Leader) ←→ Broker 2 (Follower) ←→ Broker 3 (Follower)
```

If Broker 1 dies, Kafka automatically promotes a follower to leader. With `replication-factor=3` and `min.insync.replicas=2`, you can lose one broker with zero data loss.

### Retention: The Replay Superpower

```bash
# Topic with 7-day retention and 100GB size limit
kafka-topics.sh --create \
  --topic order-events \
  --partitions 6 \
  --replication-factor 3 \
  --config retention.ms=604800000 \
  --config retention.bytes=107374182400
```

A new analytics service can subscribe to `order-events` and replay the entire 7-day history — something impossible with traditional queues.

### Kafka at LinkedIn (Its Birthplace)

Kafka was built at LinkedIn in 2010 to handle activity streams — page views, searches, clicks. Today LinkedIn processes over 7 trillion messages per day through Kafka. The log-based architecture made it possible to build the real-time analytics, recommendation, and monitoring systems that LinkedIn runs on.

### Key Takeaway

Kafka's power comes from its log architecture: ordered, partitioned, replicated, and retained. Partitions enable parallelism; consumer groups enable horizontal scaling; keys enable ordering guarantees; retention enables replay. These four concepts together explain why Kafka dominates high-throughput event streaming.
""",

    5: """## Message Ordering and Exactly-Once Delivery

Two of the most frequently misunderstood guarantees in distributed messaging: ordering and delivery semantics. Getting these wrong causes subtle, hard-to-debug bugs in production — duplicate charges, out-of-order state updates, missing records.

### The Three Delivery Semantics

**At-most-once**: Messages may be lost, never duplicated. Fire and forget.
```
Producer → Broker → Consumer
          (if broker crashes before ack, message is lost)
```

**At-least-once**: Messages are never lost, but may be duplicated. The safe default.
```
Producer → Broker → Consumer
          (on failure, producer retries → consumer sees duplicate)
```

**Exactly-once**: Messages are never lost and never duplicated. Hard. Expensive.

For most systems, **at-least-once + idempotent consumers** is the practical solution.

### Why Exactly-Once is Hard

The fundamental problem is the **two-generals problem**: acknowledgment itself can be lost.

```mermaid
sequenceDiagram
    participant P as Producer
    participant B as Broker
    P->>B: send(message)
    B->>B: write to disk ✓
    B-->>P: ack (LOST IN NETWORK)
    Note over P: No ack received — timeout
    P->>B: retry send(message)
    B->>B: write again → DUPLICATE
```

### Kafka's Exactly-Once (EOS)

Kafka achieves exactly-once through two mechanisms:

**1. Idempotent Producer**: Each producer gets a `ProducerID`. Each message gets a sequence number. The broker deduplicates retries.

```python
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    enable_idempotence=True,        # Idempotent producer
    acks='all',                     # Wait for all in-sync replicas
    retries=2147483647,             # Retry forever
    max_in_flight_requests_per_connection=5
)
```

**2. Transactions**: Atomic writes across multiple partitions/topics.

```python
producer.init_transactions()
try:
    producer.begin_transaction()
    producer.send('output-topic', key=b'key', value=b'processed')
    producer.send_offsets_to_transaction(offsets, 'my-consumer-group')
    producer.commit_transaction()
except Exception:
    producer.abort_transaction()
```

### Ordering Within Partitions

Kafka guarantees order within a partition, not across partitions. Use partition keys to ensure related messages go to the same partition:

```python
# All events for user-123 go to the same partition → ordered
producer.send('user-events', key=b'user-123', value=event_data)
```

The pitfall: if you use `max.in.flight.requests.per.connection > 1` without idempotence, a retry can overtake a later message, breaking order.

### The Practical Solution: Idempotent Consumers

Even with at-least-once delivery, make your consumers idempotent. An idempotent consumer produces the same result whether it processes a message once or ten times.

**Strategy 1: Database unique constraint**
```sql
INSERT INTO processed_events (event_id, order_id, processed_at)
VALUES ('evt-uuid-123', 'ord-9821', NOW())
ON CONFLICT (event_id) DO NOTHING;
-- Duplicate events are silently ignored
```

**Strategy 2: Check-then-act**
```python
def process_payment(event):
    if Payment.objects.filter(event_id=event['event_id']).exists():
        logger.info(f"Duplicate event {event['event_id']}, skipping")
        return
    Payment.objects.create(
        event_id=event['event_id'],
        order_id=event['order_id'],
        amount=event['amount']
    )
```

**Strategy 3: Natural idempotency**

Some operations are naturally idempotent:
```python
# SET is idempotent — running 10 times has same result as once
redis.set(f"user:{user_id}:email_verified", "true")

# INCREMENT is NOT idempotent — 10 runs = 10x the effect
redis.incr(f"user:{user_id}:login_count")  # Dangerous on retry!
```

### Ordering in SQS

Standard SQS queues offer **best-effort ordering** — not guaranteed. For strict ordering, use **SQS FIFO** queues:

```python
sqs.send_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123/orders.fifo',
    MessageBody=json.dumps(order_event),
    MessageGroupId='order-9821',        # All msgs in group are ordered
    MessageDeduplicationId='evt-uuid'   # Exactly-once within 5 minutes
)
```

FIFO queues have a throughput limit (3,000 msgs/sec with batching), so they're not for high-throughput scenarios.

### Real-World: Stripe's Payment Idempotency

Stripe handles this at the API level with **idempotency keys**. Every payment request includes a client-generated UUID. If the network fails and you retry, Stripe sees the same key and returns the cached result instead of charging again. This is at-least-once delivery made safe through idempotency — no exactly-once machinery needed.

### Key Takeaway

Exactly-once delivery is achievable (Kafka EOS) but expensive. For most systems, at-least-once delivery with idempotent consumers gives you equivalent correctness at lower cost. Always design your consumers to handle duplicate messages safely.
""",

    6: """## Kafka vs RabbitMQ vs SQS: Choosing the Right Tool

There are three dominant message brokers in modern systems: **Apache Kafka**, **RabbitMQ**, and **Amazon SQS/SNS**. They're often used interchangeably in conversation but serve fundamentally different purposes. Picking the wrong one creates architectural debt that's painful to undo.

### The Mental Model

- **Kafka**: A distributed, ordered, persistent log. Optimized for high-throughput streaming, event sourcing, and replay.
- **RabbitMQ**: A traditional message broker with rich routing. Optimized for task queues, complex routing patterns, and low-latency delivery.
- **SQS**: A fully managed, serverless queue. Optimized for simplicity, AWS integration, and operational ease.

### Detailed Comparison

| Feature | Kafka | RabbitMQ | SQS |
|---|---|---|---|
| Throughput | Millions/sec | Tens of thousands/sec | Thousands/sec |
| Message Retention | Days/weeks | Until consumed | Up to 14 days |
| Ordering | Per-partition | Per-queue | FIFO queues only |
| Replay | Yes (seek by offset) | No | No |
| Routing | Topic + partition key | Exchanges + bindings | Basic (SNS for fan-out) |
| Protocol | Kafka binary | AMQP | AWS SDK/HTTP |
| Operational load | High (ZooKeeper/KRaft) | Medium | None (fully managed) |
| Latency | ~5-15ms | ~1ms | ~10-20ms |

### When to Choose Kafka

Use Kafka when you need:
- **High throughput**: Processing millions of events per second (clickstreams, IoT sensors, logs)
- **Replay**: New services consuming historical data, debugging, reprocessing after a bug fix
- **Event sourcing**: Kafka as the source of truth for system state
- **Stream processing**: Feeding Kafka Streams, Flink, or Spark for real-time analytics
- **Audit log**: Immutable, ordered record of all events

```mermaid
graph LR
    App[Application] --> K[Kafka<br/>order-events topic]
    K --> A[Analytics Service]
    K --> B[Fraud Detection]
    K --> C[Inventory]
    K --> D[New Service<br/>replays 7 days]
```

**Example**: LinkedIn's activity feed, Uber's real-time surge pricing, Netflix's viewing event pipeline.

### When to Choose RabbitMQ

Use RabbitMQ when you need:
- **Complex routing**: Route messages based on content, headers, or binding patterns
- **Task queues**: Distribute work items (video encoding, image resizing, email sending)
- **Low latency**: Sub-millisecond delivery for real-time systems
- **Priority queues**: Higher-priority tasks processed first
- **Request-reply**: RPC-style patterns

```python
# RabbitMQ topic exchange — route by routing key pattern
channel.exchange_declare(exchange='orders', exchange_type='topic')

# Bind queues with patterns
channel.queue_bind(queue='eu-orders', exchange='orders', routing_key='orders.eu.*')
channel.queue_bind(queue='premium', exchange='orders', routing_key='orders.*.premium')

# Publish with routing key
channel.basic_publish(
    exchange='orders',
    routing_key='orders.eu.premium',  # Matches BOTH queues
    body=json.dumps(order)
)
```

**Example**: A video platform routing transcoding jobs by priority — premium users' videos encode first.

### When to Choose SQS

Use SQS when you need:
- **Operational simplicity**: No servers to manage, scales automatically
- **AWS-native integration**: Lambda triggers, ECS auto-scaling, tight IAM integration
- **Standard workloads**: Task queues, decoupled services, background jobs
- **Startup / MVP speed**: Fastest path to production queue infrastructure

```python
# SQS is simple to start with
sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps(payload))
```

**Example**: Most AWS-hosted startups and mid-size companies. Shopify uses SQS for background job processing.

### The Decision Framework

```
High throughput (>100k/sec) or need replay? → Kafka
Complex routing rules or RPC patterns?       → RabbitMQ
AWS-native, want zero ops, standard load?   → SQS
```

### The Hybrid Approach

Many large systems use all three:
- **Kafka**: Real-time event streaming pipeline
- **SQS**: Task queues for async background jobs
- **SNS**: Fan-out to multiple SQS queues

Uber uses Kafka for real-time event streaming (location updates, surge calculation) while using simpler queues for task processing (push notifications, receipt emails).

### Key Takeaway

Kafka is not a replacement for RabbitMQ or SQS — they solve different problems. Choose Kafka for streaming and replay, RabbitMQ for routing and task queues, and SQS for serverless AWS workloads. The worst architectural mistake is using Kafka when a simple SQS queue would do — you add massive operational complexity for no benefit.
""",

    7: """## Event-Driven Architecture Patterns: Choreography vs Orchestration

Event-driven architecture (EDA) is not just about using a message queue — it's a design philosophy where services communicate exclusively through events, with no direct coupling. There are two approaches to coordinating multi-step workflows: **choreography** and **orchestration**.

### What is Event-Driven Architecture?

In EDA, services don't call each other. They emit events ("something happened") and react to events ("do something because this happened"). The message broker is the only shared infrastructure.

```mermaid
graph LR
    OS[Order Service] -->|order.placed| B[Broker]
    B --> IS[Inventory Service]
    B --> PS[Payment Service]
    B --> NS[Notification Service]
    IS -->|inventory.reserved| B
    PS -->|payment.captured| B
    NS -->|notification.sent| B
```

No service knows about another. The Order Service doesn't import or call the Inventory Service. They're connected only through the shared event contract.

### Choreography: Services React Independently

In choreography, there's no central coordinator. Each service listens for events and emits new events in response.

**E-commerce order flow (choreography)**:
```
order.placed →
  Inventory Service: reserves stock, emits inventory.reserved →
    Payment Service: captures payment, emits payment.captured →
      Shipping Service: creates shipment, emits shipment.created →
        Notification Service: sends confirmation email
```

```python
# Inventory Service — pure choreography
@kafka_consumer(topic='order.placed')
def handle_order_placed(event):
    order_id = event['order_id']
    items = event['items']

    reserve_inventory(items)

    kafka_producer.send('inventory.reserved', {
        'order_id': order_id,
        'reserved_at': datetime.now().isoformat()
    })
```

**Pros**: Loosely coupled, each service can be deployed independently, simple to understand locally.

**Cons**: Hard to see the big picture — where is the workflow documented? Hard to debug — you have to trace events across 5 services. Hard to handle failures — what if payment fails after inventory is reserved?

### Orchestration: Central Coordinator

In orchestration, a central **orchestrator** (or saga orchestrator) tells each service what to do and collects results.

```mermaid
sequenceDiagram
    participant O as Order Orchestrator
    participant I as Inventory Service
    participant P as Payment Service
    participant S as Shipping Service
    O->>I: reserve_inventory(order_id)
    I-->>O: inventory.reserved
    O->>P: capture_payment(order_id)
    P-->>O: payment.captured
    O->>S: create_shipment(order_id)
    S-->>O: shipment.created
```

**Pros**: Workflow is visible in one place, easier to debug, easier to handle failures (orchestrator knows the state).

**Cons**: The orchestrator becomes a central dependency — if it's down, the whole flow stops.

### CQRS: Command Query Responsibility Segregation

CQRS separates read models from write models. Commands mutate state and emit events. Queries read from optimized, pre-built views.

```mermaid
graph LR
    Write[Write Side<br/>Commands] --> ES[Event Store<br/>Kafka/EventStoreDB]
    ES --> P[Projector]
    P --> Read[Read Side<br/>MongoDB / Redis]
    UI[UI] --> Write
    UI --> Read
```

```python
# Command side: append event to log
def place_order(order_data):
    event = OrderPlaced(order_id=uuid4(), **order_data)
    event_store.append('orders', event)

# Query side: pre-built read model updated by projector
def get_order_status(order_id):
    return mongo_db.orders.find_one({'_id': order_id})
    # Returns denormalized view built from events
```

This allows the read side to be scaled and optimized independently. The write side is simple and consistent. The read side can have multiple projections — one for the UI, one for analytics, one for the API.

### Event Sourcing + CQRS Together

Event sourcing stores the full event history as the source of truth. CQRS builds read models from that history.

```
Events: [OrderPlaced, ItemAdded, PaymentCaptured, OrderShipped]
                    ↓ Project
Read Model: {status: "shipped", items: [...], paid: true}
```

This is how Axon Framework, EventStoreDB, and many DDD-heavy systems work.

### Real-World: Uber's Dispatch System

Uber's trip matching is event-driven. When a rider requests a trip (`ride.requested`):
- Driver matching service listens and assigns a driver, emits `driver.assigned`
- Notification service listens to `driver.assigned` and sends push notifications
- Pricing service listens to `ride.requested` and calculates surge, emits `price.calculated`
- ETA service listens to `driver.assigned` and calculates arrival time

All choreographed through Kafka. No single service knows the full flow — which is both a strength (independence) and a challenge (observability).

### Key Takeaway

Choreography gives you decoupled, independent services but makes workflows implicit and hard to debug. Orchestration makes workflows explicit and debuggable but introduces central coordination. CQRS and event sourcing extend EDA to the data model level. In practice, use choreography for simple event reactions and orchestration (saga orchestrators) for complex multi-step workflows with compensation logic.
""",

    8: """## The Saga Pattern: Distributed Transactions Without Two-Phase Commit

In a monolith, you handle complex multi-step operations with a database transaction: everything succeeds or everything rolls back. In microservices, each service has its own database. There's no single transaction that spans them. The **Saga pattern** is the solution.

### The Problem: Distributed Transactions

Consider placing an order that requires:
1. Creating the order record (Order Service)
2. Reserving inventory (Inventory Service)
3. Charging the customer (Payment Service)
4. Scheduling shipping (Shipping Service)

These span four databases. If Payment fails after Inventory reserved stock, you have inconsistent state — stock is held but no order exists.

**Two-Phase Commit (2PC)** solves this with a distributed lock, but it's fragile (coordinator crashes → all services block), slow, and doesn't work across services you don't own (e.g., Stripe).

### What is a Saga?

A Saga is a sequence of local transactions. Each step publishes an event or sends a command triggering the next step. If any step fails, the saga executes **compensating transactions** to undo the previous steps.

```mermaid
graph LR
    S1[1. Create Order<br/>PENDING] -->|order.created| S2[2. Reserve Inventory]
    S2 -->|inventory.reserved| S3[3. Charge Payment]
    S3 -->|payment.captured| S4[4. Schedule Shipping]
    S4 -->|shipping.scheduled| S5[Order COMPLETE]

    S3 -->|payment.failed| C2[Compensate:<br/>Release Inventory]
    C2 -->|inventory.released| C1[Compensate:<br/>Cancel Order]
```

### Choreography-Based Saga

Each service listens for events, performs its local transaction, and emits the next event.

```python
# Payment Service — choreography saga step
@kafka_consumer(topic='inventory.reserved')
def handle_inventory_reserved(event):
    order_id = event['order_id']
    amount = event['amount']

    try:
        charge_id = stripe.charge(amount, event['payment_method'])
        db.payments.insert({'order_id': order_id, 'charge_id': charge_id})

        kafka_producer.send('payment.captured', {
            'order_id': order_id,
            'charge_id': charge_id
        })
    except stripe.CardError:
        # Trigger compensation
        kafka_producer.send('payment.failed', {
            'order_id': order_id,
            'reason': 'card_declined'
        })

# Inventory Service — compensation handler
@kafka_consumer(topic='payment.failed')
def handle_payment_failed(event):
    order_id = event['order_id']
    db.inventory.release(order_id)    # Undo the reservation
    kafka_producer.send('inventory.released', {'order_id': order_id})
```

### Orchestration-Based Saga

A central saga orchestrator manages the state machine and directs each service.

```python
class OrderSaga:
    def __init__(self, order_id):
        self.order_id = order_id
        self.state = 'STARTED'

    def start(self):
        self.state = 'RESERVING_INVENTORY'
        inventory_service.send_command('ReserveInventory', self.order_id)

    def on_inventory_reserved(self):
        self.state = 'CHARGING_PAYMENT'
        payment_service.send_command('CapturePayment', self.order_id)

    def on_payment_captured(self):
        self.state = 'SCHEDULING_SHIPPING'
        shipping_service.send_command('ScheduleShipment', self.order_id)

    def on_payment_failed(self):
        self.state = 'COMPENSATING'
        inventory_service.send_command('ReleaseInventory', self.order_id)

    def on_inventory_released(self):
        self.state = 'FAILED'
        order_service.send_command('CancelOrder', self.order_id)
```

### Compensating Transactions

A compensating transaction is the semantic undo of a step. Note: it's not a database rollback — it's a new forward transaction that undoes the business effect.

| Step | Compensating Transaction |
|---|---|
| Create Order | Cancel Order |
| Reserve Inventory | Release Inventory |
| Charge Payment | Issue Refund |
| Schedule Shipping | Cancel Shipment |

**Important**: Not all steps can be compensated. "Send email" cannot be unsent. Design compensations early. Some steps are **pivot transactions** — once crossed, the saga commits regardless (e.g., payment captured → always ship).

### Idempotency in Sagas

Saga steps must be idempotent. The orchestrator may retry a command if it doesn't receive a response.

```python
def reserve_inventory(order_id, items):
    # Check if already reserved (idempotency)
    if Reservation.objects.filter(order_id=order_id).exists():
        return  # Already done, no-op

    # Perform the reservation
    Reservation.objects.create(order_id=order_id, items=items, status='reserved')
```

### Real-World: Amazon's Order System

Amazon's order placement is a saga. When you click "Place Order":
1. Order created (PENDING)
2. Payment authorized (not charged yet)
3. Inventory allocated at warehouse
4. Payment captured (now charged)
5. Shipping label created

If inventory allocation fails (item out of stock), the saga compensates: void the payment authorization, cancel the order, send cancellation email. Each step is independently retryable and compensatable.

### Key Takeaway

Sagas replace distributed transactions with coordinated local transactions + compensating actions. Use choreography for simple, linear flows. Use orchestration for complex flows with many failure modes. Always design compensating transactions upfront — retrofitting them is painful. Accept eventual consistency: there will be a brief window where the system is in an intermediate state.
""",

    9: """## Event Sourcing: The Event Log as Source of Truth

In traditional systems, you store the current state: a database row shows that an order's status is "shipped." But how did it get there? What was the previous status? When did it change, and why? That history is lost. **Event sourcing** solves this by making the event log the primary source of truth.

### The Core Idea

Instead of storing current state, store every event that ever changed the state. Current state is derived by replaying events.

**Traditional approach** (store state):
```sql
orders: {id: 'ord-9821', status: 'shipped', updated_at: '2024-01-20'}
-- History lost. Why is it shipped? What happened before?
```

**Event sourcing approach** (store events):
```
Events for ord-9821:
  1. OrderPlaced    {items: [...], total: 89.99}   2024-01-15 10:30
  2. PaymentCaptured {charge_id: 'ch-xyz'}         2024-01-15 10:31
  3. InventoryPicked {warehouse: 'SEA-01'}          2024-01-16 09:00
  4. OrderShipped   {tracking: 'UPS-123456'}        2024-01-20 14:00
-- Full history preserved. Derive current state by replaying.
```

### Implementing Event Sourcing

```python
# Event definitions
@dataclass
class OrderPlaced:
    event_type: str = 'OrderPlaced'
    order_id: str
    items: list
    total: float
    timestamp: str

@dataclass
class PaymentCaptured:
    event_type: str = 'PaymentCaptured'
    order_id: str
    charge_id: str
    timestamp: str

# Aggregate: derives state from events
class Order:
    def __init__(self):
        self.status = None
        self.items = []
        self.total = 0
        self.charge_id = None

    def apply(self, event):
        if event['event_type'] == 'OrderPlaced':
            self.status = 'pending'
            self.items = event['items']
            self.total = event['total']
        elif event['event_type'] == 'PaymentCaptured':
            self.status = 'paid'
            self.charge_id = event['charge_id']
        elif event['event_type'] == 'OrderShipped':
            self.status = 'shipped'

    @classmethod
    def load(cls, order_id, event_store):
        order = cls()
        events = event_store.get_events(order_id)
        for event in events:
            order.apply(event)
        return order

# Reconstruct current state
order = Order.load('ord-9821', event_store)
print(order.status)  # 'shipped'
```

### Projections: Read-Optimized Views

Replaying all events every read is slow. **Projections** (or read models) are derived views built by processing the event stream.

```python
# Projector: builds a fast-read view from events
class OrderStatusProjection:
    def __init__(self, db):
        self.db = db

    def handle(self, event):
        if event['event_type'] == 'OrderPlaced':
            self.db.order_status.insert({
                'order_id': event['order_id'],
                'status': 'pending',
                'total': event['total'],
                'placed_at': event['timestamp']
            })
        elif event['event_type'] == 'OrderShipped':
            self.db.order_status.update(
                {'order_id': event['order_id']},
                {'$set': {'status': 'shipped', 'tracking': event['tracking']}}
            )
```

You can have multiple projections — one for customer-facing status, one for warehouse operations, one for analytics — all derived from the same event stream.

### Event Schema Evolution

Events are immutable — you can never change a past event. But schemas change over time. Strategies:

**Upcasting**: Transform old events to new format on read
```python
def upcast_event(event):
    if event['event_type'] == 'OrderPlaced' and event.get('version', '1') == '1':
        # v1 had 'price', v2 has 'total'
        event['total'] = event.pop('price')
        event['version'] = '2'
    return event
```

**Weak schema**: Use optional fields. Old events just won't have new fields.

### CQRS + Event Sourcing

Event sourcing pairs naturally with CQRS:
- **Write side**: Append events to the event store (Kafka, EventStoreDB)
- **Read side**: Projections built from events, stored in MongoDB/Redis for fast reads

```mermaid
graph LR
    API[API] -->|command| WS[Write Side<br/>Validate + Append Event]
    WS --> ES[Event Store<br/>Kafka / EventStoreDB]
    ES --> P[Projector]
    P --> RS[Read Store<br/>MongoDB / Redis]
    API -->|query| RS
```

### Snapshots: Performance Optimization

Loading 10,000 events to reconstruct a bank account balance is slow. Snapshots save the state at a point in time:

```python
# Save snapshot every 100 events
if len(events) % 100 == 0:
    event_store.save_snapshot(aggregate_id, current_state, version=len(events))

# Load: get latest snapshot + events after it
snapshot = event_store.get_snapshot(aggregate_id)
events_after = event_store.get_events(aggregate_id, from_version=snapshot.version)
state = apply_events(snapshot.state, events_after)
```

### Real-World: Financial Systems

Banks and fintech companies use event sourcing extensively. A bank account's "balance" is derived from a ledger of transactions — deposits, withdrawals, transfers. The ledger (event log) is the source of truth. The balance is a projection. This is why banks can show you every transaction since account opening — they never delete history.

Stripe's payment system is event-sourced: every charge, refund, dispute, and payout is an immutable event. The current state of a customer's balance is computed from these events.

### Key Takeaway

Event sourcing trades the simplicity of mutable state for a complete, auditable history and the ability to rebuild any view from scratch. Use it when audit trails matter, when you need temporal queries ("what was the state at this point in time?"), or when you want to add new read models without touching the write path. Avoid it for simple CRUD applications — the complexity isn't justified.
""",

    10: """## Practice: Designing an Event-Driven Notification System

This session applies everything from the previous nine sessions to a realistic system design problem. Work through this the way you would in an interview: understand requirements, design the architecture, address failure modes, and justify your choices.

### The Problem

Design the notification system for a food delivery app (think DoorDash/Uber Eats). When a customer places an order, the following notifications must be sent at the right times:

1. **Order confirmed** → Customer (SMS + push)
2. **Restaurant accepted** → Customer (push)
3. **Driver assigned** → Customer (push) + Restaurant (push)
4. **Driver picked up** → Customer (push)
5. **Order delivered** → Customer (push + email receipt)

Additionally: restaurants and drivers get their own notification streams.

### Step 1: Requirements Clarification

**Scale**: 1 million orders/day = ~12 orders/second average, 50 orders/second peak.
**Reliability**: Notifications must be delivered at-least-once. Missing a "driver assigned" notification is bad UX.
**Latency**: Notifications should arrive within 2 seconds of the triggering event.
**Channels**: Push (iOS/Android via APNs/FCM), SMS (Twilio), Email (SendGrid).

### Step 2: Core Architecture

```mermaid
graph TD
    OS[Order Service] -->|order.placed| K[Kafka<br/>order-events topic]
    RS[Restaurant Service] -->|restaurant.accepted| K
    DS[Driver Service] -->|driver.assigned<br/>driver.picked_up<br/>order.delivered| K

    K --> NO[Notification Orchestrator]
    NO --> PQ[Push Queue<br/>SQS]
    NO --> SQ[SMS Queue<br/>SQS]
    NO --> EQ[Email Queue<br/>SQS]

    PQ --> PS[Push Service<br/>FCM/APNs]
    SQ --> SS[SMS Service<br/>Twilio]
    EQ --> ES[Email Service<br/>SendGrid]
```

### Step 3: The Notification Orchestrator

The orchestrator consumes Kafka events and fans out to the appropriate notification channels.

```python
@kafka_consumer(topic='order-events', group_id='notification-orchestrator')
def handle_order_event(event):
    event_type = event['event_type']
    order_id = event['order_id']

    # Load order context (customer, restaurant, driver IDs)
    context = order_service.get_context(order_id)

    if event_type == 'order.placed':
        enqueue_push(context.customer_device_token,
                     "Order confirmed!", "Your order is being sent to the restaurant")
        enqueue_sms(context.customer_phone,
                    f"Your order #{order_id} has been confirmed!")

    elif event_type == 'driver.assigned':
        enqueue_push(context.customer_device_token,
                     "Driver on the way!", f"{context.driver_name} is picking up your order")
        enqueue_push(context.restaurant_device_token,
                     "Driver arriving", f"{context.driver_name} will arrive in {context.eta} min")

    elif event_type == 'order.delivered':
        enqueue_push(context.customer_device_token, "Delivered!", "Enjoy your meal!")
        enqueue_email(context.customer_email, template='receipt', data=context)
```

### Step 4: Handling Failures

**Push notification failure**: FCM/APNs tokens expire. On a 410 (invalid token) response, publish a `device.token_invalid` event. The User Service subscribes and removes the stale token.

**SMS failure**: Twilio may be temporarily unavailable. The SMS SQS queue retries with exponential backoff. After 5 failures, message goes to DLQ + alert.

**Kafka consumer failure**: The notification orchestrator uses manual offset commits. Only commits after successfully enqueuing to SQS. If it crashes mid-processing, it restarts from the last committed offset.

```python
for message in kafka_consumer:
    try:
        handle_order_event(message.value)
        kafka_consumer.commit()  # Only after successful enqueue
    except Exception as e:
        logger.error(f"Failed: {e}")
        # Don't commit — will re-process on restart
```

### Step 5: Idempotency

The same event may be delivered twice to the Notification Orchestrator (at-least-once). Guard against duplicate notifications:

```python
def enqueue_push(device_token, title, body, event_id):
    # Use event_id as deduplication key
    if redis.set(f"notif:sent:{event_id}:{device_token}", "1", nx=True, ex=3600):
        # nx=True: only set if not exists (atomic check-and-set)
        sqs.send_message(QueueUrl=PUSH_QUEUE_URL,
                         MessageBody=json.dumps({'token': device_token, 'title': title}),
                         MessageDeduplicationId=f"{event_id}-{device_token}")
    # If key already exists: duplicate, skip
```

### Step 6: Observability

Track these metrics:
- Kafka consumer lag (are we keeping up with the event stream?)
- Notification delivery rate per channel (push: 95%+, SMS: 99%+, email: 99.9%+)
- End-to-end latency: event timestamp → notification delivered
- DLQ depth (alerts for any messages that exhausted retries)

### Interview Answer Framework

When asked "design a notification system":
1. Start with the event-driven backbone (Kafka for events)
2. Separate concerns: event processing (orchestrator) from delivery (push/SMS/email services)
3. Use queues between orchestrator and delivery services (resilience, backpressure)
4. Address idempotency explicitly (duplicate events = duplicate notifications = angry users)
5. Design for failure of each external service (FCM down, Twilio down, SendGrid down)
6. Discuss observability (how do you know it's working?)

### Key Takeaway

A well-designed event-driven notification system handles the full complexity of distributed systems: at-least-once delivery, idempotency, fan-out to multiple channels, and graceful degradation when external services fail. The patterns from this module — pub/sub, DLQ, saga-style compensation, event-driven orchestration — all appear in this one system.
"""
}

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-fundamentals.json') as f:
    data = json.load(f)

# Find index 5 (Message Queues) and update sessions
mq_item = data[5]
assert mq_item['topic'] == 'Message Queues', f"Expected Message Queues at index 5, got {mq_item['topic']}"

for session in mq_item['plan']['sessions']:
    n = session['sessionNumber']
    if n in MQ_CONTENT:
        session['content'] = MQ_CONTENT[n]
        print(f"  Added content to MQ Session {n}: {session['title']} ({len(MQ_CONTENT[n].split())} words)")

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-fundamentals.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("\nMessage Queues content written successfully.")
