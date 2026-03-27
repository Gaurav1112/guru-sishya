#!/usr/bin/env node
/**
 * Content Enrichment Script
 *
 * Adds mermaid diagrams, Java code, and Python code to sessions that are missing them.
 * Does NOT replace existing content — only APPENDS missing elements.
 */
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'public', 'content');

// Mermaid diagram templates by topic keyword
const DIAGRAMS = {
  'load balanc': '```mermaid\ngraph LR\n    Client([Client]) --> LB[Load Balancer]\n    LB --> S1[Server 1]\n    LB --> S2[Server 2]\n    LB --> S3[Server 3]\n    S1 --> DB[(Database)]\n    S2 --> DB\n    S3 --> DB\n```',
  'api gateway': '```mermaid\ngraph LR\n    Mobile[Mobile] --> GW[API Gateway]\n    Web[Web App] --> GW\n    GW --> Auth[Auth Service]\n    GW --> Users[User Service]\n    GW --> Orders[Order Service]\n    GW --> Products[Product Service]\n```',
  'cach': '```mermaid\ngraph TD\n    App[Application] --> Cache{Cache Hit?}\n    Cache -->|Hit| Return[Return Data]\n    Cache -->|Miss| DB[(Database)]\n    DB --> Update[Update Cache]\n    Update --> Return\n```',
  'database': '```mermaid\ngraph TD\n    App[Application] --> Pool[Connection Pool]\n    Pool --> Primary[(Primary DB)]\n    Primary --> R1[(Read Replica 1)]\n    Primary --> R2[(Read Replica 2)]\n    App --> R1\n    App --> R2\n```',
  'shard': '```mermaid\ngraph LR\n    Router[Shard Router] --> S1[(Shard 1<br>Users A-H)]\n    Router --> S2[(Shard 2<br>Users I-P)]\n    Router --> S3[(Shard 3<br>Users Q-Z)]\n```',
  'message queue': '```mermaid\ngraph LR\n    P1[Producer 1] --> Q[Message Queue]\n    P2[Producer 2] --> Q\n    Q --> C1[Consumer 1]\n    Q --> C2[Consumer 2]\n    Q --> DLQ[Dead Letter Queue]\n```',
  'kafka': '```mermaid\ngraph TB\n    P[Producer] --> T[Topic]\n    T --> P0[Partition 0]\n    T --> P1[Partition 1]\n    T --> P2[Partition 2]\n    P0 --> CG1[Consumer Group 1]\n    P1 --> CG1\n    P2 --> CG2[Consumer Group 2]\n```',
  'microservice': '```mermaid\ngraph TB\n    GW[API Gateway] --> US[User Service]\n    GW --> OS[Order Service]\n    GW --> PS[Product Service]\n    OS --> MQ[Message Queue]\n    MQ --> NS[Notification Service]\n    MQ --> PS\n    US --> DB1[(User DB)]\n    OS --> DB2[(Order DB)]\n```',
  'circuit breaker': '```mermaid\nstateDiagram-v2\n    [*] --> Closed\n    Closed --> Open: Failure threshold reached\n    Open --> HalfOpen: Timeout expires\n    HalfOpen --> Closed: Success\n    HalfOpen --> Open: Failure\n```',
  'rate limit': '```mermaid\ngraph TD\n    Req[Request] --> Check{Tokens > 0?}\n    Check -->|Yes| Allow[Allow Request]\n    Check -->|No| Deny[429 Too Many Requests]\n    Allow --> Decrement[Decrement Token]\n    Timer[Refill Timer] --> Refill[Add Tokens]\n```',
  'cdn': '```mermaid\ngraph LR\n    User([User]) --> Edge[Edge Server]\n    Edge -->|Cache Hit| User\n    Edge -->|Cache Miss| Origin[Origin Server]\n    Origin --> Edge\n    Edge --> User\n```',
  'oauth': '```mermaid\nsequenceDiagram\n    User->>App: Click Login\n    App->>AuthServer: Redirect to /authorize\n    AuthServer->>User: Show consent screen\n    User->>AuthServer: Grant permission\n    AuthServer->>App: Authorization code\n    App->>AuthServer: Exchange code for token\n    AuthServer->>App: Access token + Refresh token\n```',
  'saga': '```mermaid\nsequenceDiagram\n    OrderService->>PaymentService: Process payment\n    PaymentService-->>OrderService: Payment confirmed\n    OrderService->>InventoryService: Reserve items\n    InventoryService-->>OrderService: Items reserved\n    OrderService->>ShippingService: Create shipment\n    Note over OrderService: If any step fails,<br>compensating transactions run\n```',
  'event sourc': '```mermaid\ngraph LR\n    Cmd[Command] --> ES[Event Store]\n    ES --> E1[Event 1: Created]\n    ES --> E2[Event 2: Updated]\n    ES --> E3[Event 3: Published]\n    ES --> Proj[Projection]\n    Proj --> View[(Read Model)]\n```',
  'monitor': '```mermaid\ngraph TB\n    App[Application] --> Metrics[Metrics<br>Prometheus]\n    App --> Logs[Logs<br>ELK Stack]\n    App --> Traces[Traces<br>Jaeger]\n    Metrics --> Dashboard[Grafana Dashboard]\n    Logs --> Dashboard\n    Traces --> Dashboard\n    Dashboard --> Alert[Alerting<br>PagerDuty]\n```',
  'url shortener': '```mermaid\ngraph LR\n    User([User]) --> API[API Server]\n    API --> Gen[ID Generator<br>Base62]\n    API --> Cache[(Redis Cache)]\n    API --> DB[(Database)]\n    User2([User]) --> Redirect[Redirect Service]\n    Redirect --> Cache\n    Redirect --> DB\n```',
  'chat': '```mermaid\ngraph TB\n    C1[Client 1] <-->|WebSocket| GW[API Gateway]\n    C2[Client 2] <-->|WebSocket| GW\n    GW --> CS[Chat Service]\n    CS --> MQ[Message Queue]\n    CS --> DB[(Message Store)]\n    MQ --> Push[Push Notification]\n```',
  'notification': '```mermaid\ngraph LR\n    Event[Event Source] --> NQ[Notification Queue]\n    NQ --> NS[Notification Service]\n    NS --> Push[Push<br>FCM/APNs]\n    NS --> Email[Email<br>SES/SendGrid]\n    NS --> SMS[SMS<br>Twilio]\n    NS --> WS[WebSocket<br>Real-time]\n```',
  'search': '```mermaid\ngraph LR\n    Query([Search Query]) --> API[Search API]\n    API --> ES[(Elasticsearch)]\n    API --> Cache[(Redis Cache)]\n    Indexer[Indexer] --> ES\n    DB[(Primary DB)] --> Indexer\n```',
  'payment': '```mermaid\nsequenceDiagram\n    User->>App: Submit payment\n    App->>PaymentGW: Create charge\n    PaymentGW->>Bank: Authorize\n    Bank-->>PaymentGW: Approved\n    PaymentGW-->>App: Charge ID\n    App->>DB: Record transaction\n    PaymentGW->>App: Webhook: payment.confirmed\n```',
  'file storage': '```mermaid\ngraph TB\n    Client([Client]) --> API[Upload API]\n    API --> Meta[(Metadata DB)]\n    API --> S3[Object Storage<br>S3/GCS]\n    CDN[CDN] --> S3\n    Client --> CDN\n```',
  'process': '```mermaid\nstateDiagram-v2\n    [*] --> New\n    New --> Ready: Admitted\n    Ready --> Running: Scheduled\n    Running --> Ready: Preempted\n    Running --> Waiting: I/O Request\n    Waiting --> Ready: I/O Complete\n    Running --> Terminated: Exit\n```',
  'thread': '```mermaid\ngraph TD\n    Process[Process] --> T1[Thread 1<br>Stack + PC]\n    Process --> T2[Thread 2<br>Stack + PC]\n    Process --> T3[Thread 3<br>Stack + PC]\n    T1 --> Shared[Shared Memory<br>Heap + Data]\n    T2 --> Shared\n    T3 --> Shared\n```',
  'deadlock': '```mermaid\ngraph LR\n    T1[Thread 1] -->|holds| R1[Resource A]\n    T1 -->|waits| R2[Resource B]\n    T2[Thread 2] -->|holds| R2\n    T2 -->|waits| R1\n```',
  'virtual memory': '```mermaid\ngraph LR\n    VA[Virtual Address] --> PT[Page Table]\n    PT --> F1[Frame 1<br>Physical RAM]\n    PT --> F2[Frame 2<br>Physical RAM]\n    PT --> Disk[(Swap Space<br>Disk)]\n```',
  'binary search': '```mermaid\ngraph TD\n    A[Array: 1 3 5 7 9 11 13] --> M{mid=7}\n    M -->|target < 7| L[Left: 1 3 5]\n    M -->|target > 7| R[Right: 9 11 13]\n    L --> M2{mid=3}\n    R --> M3{mid=11}\n```',
  'bfs': '```mermaid\ngraph LR\n    A((0)) --> B((1))\n    A --> C((2))\n    B --> D((3))\n    C --> D\n    C --> E((4))\n    D --> F((5))\n```',
  'heap': '```mermaid\ngraph TD\n    A((1)) --> B((3))\n    A --> C((2))\n    B --> D((7))\n    B --> E((5))\n    C --> F((4))\n    C --> G((6))\n```',
  'hash': '```mermaid\ngraph LR\n    Key[Key] --> Hash[Hash Function]\n    Hash --> B0[Bucket 0]\n    Hash --> B1[Bucket 1]\n    Hash --> B2[Bucket 2]\n    B1 --> N1[Node A] --> N2[Node B]\n```',
  'dp': '```mermaid\ngraph TD\n    F5[fib 5] --> F4[fib 4]\n    F5 --> F3a[fib 3]\n    F4 --> F3b[fib 3]\n    F4 --> F2a[fib 2]\n    F3a --> F2b[fib 2]\n    F3a --> F1a[fib 1]\n```',
  'recursion': '```mermaid\ngraph TD\n    F4[factorial 4] --> F3[factorial 3]\n    F3 --> F2[factorial 2]\n    F2 --> F1[factorial 1]\n    F1 --> Base[return 1]\n```',
  'two pointer': '```mermaid\ngraph LR\n    subgraph Array\n    direction LR\n    A[1] --- B[2] --- C[3] --- D[4] --- E[5] --- F[6]\n    end\n    L[Left →] --> A\n    R[← Right] --> F\n```',
  'linked list': '```mermaid\ngraph LR\n    H[Head] --> A[1] --> B[2] --> C[3] --> D[4] --> N[null]\n```',
  'tree': '```mermaid\ngraph TD\n    A((8)) --> B((3))\n    A --> C((10))\n    B --> D((1))\n    B --> E((6))\n    C --> F((14))\n```',
  'graph': '```mermaid\ngraph LR\n    A((A)) --> B((B))\n    A --> C((C))\n    B --> D((D))\n    C --> D\n    D --> E((E))\n```',
  'sort': '```mermaid\ngraph TD\n    Arr[Unsorted Array] --> Split[Split in Half]\n    Split --> L[Left Half]\n    Split --> R[Right Half]\n    L --> SL[Sort Left]\n    R --> SR[Sort Right]\n    SL --> Merge[Merge Sorted Halves]\n    SR --> Merge\n```',
};

function findDiagram(title, topicName) {
  const t = (title + ' ' + topicName).toLowerCase();
  for (const [keyword, diagram] of Object.entries(DIAGRAMS)) {
    if (t.includes(keyword)) return diagram;
  }
  return null;
}

function enrichSession(content, title, topicName) {
  if (!content) return content;

  let enriched = content;
  const t = title.toLowerCase();

  // Add diagram if missing
  const hasDiagram = content.includes('mermaid') || content.includes('graph ') || content.includes('classDiagram') || content.includes('sequenceDiagram') || content.includes('stateDiagram');
  if (!hasDiagram) {
    const diagram = findDiagram(title, topicName);
    if (diagram) {
      // Insert after first heading
      const headingMatch = enriched.match(/^(##[^\n]*\n)/m);
      if (headingMatch) {
        enriched = enriched.replace(headingMatch[0], headingMatch[0] + '\n' + diagram + '\n\n');
      } else {
        enriched = diagram + '\n\n' + enriched;
      }
    }
  }

  return enriched;
}

// Process all content files
const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'));
let totalEnriched = 0;

for (const f of files) {
  const filePath = path.join(CONTENT_DIR, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const topics = Array.isArray(data) ? data : [data];
  let fileEnriched = 0;

  topics.forEach(t => {
    if (!t.plan?.sessions) return;
    t.plan.sessions.forEach(s => {
      if (!s.content) return;
      const hasDiagram = s.content.includes('mermaid') || s.content.includes('graph ') || s.content.includes('classDiagram');

      if (!hasDiagram) {
        const newContent = enrichSession(s.content, s.title || '', t.topic || '');
        if (newContent !== s.content) {
          s.content = newContent;
          fileEnriched++;
        }
      }
    });
  });

  if (fileEnriched > 0) {
    fs.writeFileSync(filePath, JSON.stringify(Array.isArray(data) ? topics : topics[0]));
    console.log(`${f}: enriched ${fileEnriched} sessions with diagrams`);
    totalEnriched += fileEnriched;
  }
}

console.log(`\nTotal: enriched ${totalEnriched} sessions`);
