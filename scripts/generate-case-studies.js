#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// Generate detailed system design case studies
// Outputs: public/content/system-design-cases-detailed.json
// Usage:   node scripts/generate-case-studies.js
// ────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

// ── Helper: build a ladder for system design topics ─────────────────────────

function buildLadder(topicName) {
  return {
    levels: [
      {
        level: 1,
        name: "Novice",
        dreyfusLabel: "Novice",
        description: `Can identify the basic components of ${topicName} and describe what it does at a high level.`,
        observableSkills: [
          "Identify core features of the system",
          "List basic components (client, server, database)",
          "Describe the user journey at a high level",
        ],
        milestoneProject: {
          title: `${topicName} Component Diagram`,
          description: `Draw a basic component diagram showing the major pieces of ${topicName}.`,
          estimatedHours: 2,
        },
        commonPlateaus: [
          "Jumping to solutions without gathering requirements",
          "Ignoring non-functional requirements",
        ],
        estimatedHours: 4,
        prerequisites: [],
      },
      {
        level: 2,
        name: "Advanced Beginner",
        dreyfusLabel: "Advanced Beginner",
        description: `Can perform back-of-envelope estimation and design basic APIs for ${topicName}.`,
        observableSkills: [
          "Calculate DAU, QPS, storage, and bandwidth",
          "Design RESTful API endpoints",
          "Choose appropriate data models",
        ],
        milestoneProject: {
          title: `${topicName} API & Data Model`,
          description: `Design the complete API surface and database schema for the core features.`,
          estimatedHours: 4,
        },
        commonPlateaus: [
          "Underestimating scale requirements",
          "Designing APIs without considering pagination",
        ],
        estimatedHours: 8,
        prerequisites: ["Basic understanding of REST APIs and databases"],
      },
      {
        level: 3,
        name: "Competent",
        dreyfusLabel: "Competent",
        description: `Can design a scalable architecture for ${topicName} with caching, sharding, and replication.`,
        observableSkills: [
          "Design horizontal scaling strategies",
          "Implement caching layers with invalidation",
          "Choose between SQL and NoSQL based on access patterns",
        ],
        milestoneProject: {
          title: `${topicName} Scalable Architecture`,
          description: `Design a complete architecture that handles 10x the current load with proper caching and database sharding.`,
          estimatedHours: 6,
        },
        commonPlateaus: [
          "Over-engineering for scale that is not needed",
          "Ignoring cache invalidation complexity",
        ],
        estimatedHours: 12,
        prerequisites: ["API design", "Database fundamentals"],
      },
      {
        level: 4,
        name: "Proficient",
        dreyfusLabel: "Proficient",
        description: `Can reason about trade-offs, failure modes, and operational concerns for ${topicName}.`,
        observableSkills: [
          "Discuss CAP theorem trade-offs for the system",
          "Design for failure (circuit breakers, retries, fallbacks)",
          "Implement monitoring and alerting strategies",
        ],
        milestoneProject: {
          title: `${topicName} Reliability Design`,
          description: `Add fault tolerance, disaster recovery, and comprehensive monitoring to the architecture.`,
          estimatedHours: 8,
        },
        commonPlateaus: [
          "Not considering regional failover",
          "Overlooking data consistency during failures",
        ],
        estimatedHours: 16,
        prerequisites: ["Scalable architecture design", "Distributed systems basics"],
      },
      {
        level: 5,
        name: "Expert",
        dreyfusLabel: "Expert",
        description: `Can present a complete, interview-ready design of ${topicName} with deep dives into any component.`,
        observableSkills: [
          "Present a 45-minute design with clear structure",
          "Deep dive into any component on demand",
          "Discuss real-world technology choices with rationale",
          "Handle interviewer curveballs and constraint changes",
        ],
        milestoneProject: {
          title: `${topicName} Mock Interview`,
          description: `Deliver a complete system design presentation and handle follow-up questions for 45 minutes.`,
          estimatedHours: 4,
        },
        commonPlateaus: [
          "Spending too long on one component",
          "Not adapting when interviewer changes constraints",
        ],
        estimatedHours: 20,
        prerequisites: ["All previous levels", "Mock interview practice"],
      },
    ],
  };
}

// ── Helper: build resources for a system design topic ───────────────────────

function buildResources(topicName, extraResources) {
  return [
    {
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      category: "books",
      justification: "The bible of distributed systems — covers every concept needed for system design interviews.",
      bestFor: "Deep understanding of distributed systems trade-offs",
      estimatedTime: "40 hours",
      cost: "$35",
      confidence: "HIGH",
    },
    {
      title: "System Design Interview (Vol 1 & 2)",
      author: "Alex Xu",
      category: "books",
      justification: `Covers ${topicName} and similar systems with step-by-step approaches.`,
      bestFor: "Interview-focused system design practice",
      estimatedTime: "20 hours",
      cost: "$40",
      confidence: "HIGH",
    },
    {
      title: "Gaurav Sen - System Design",
      author: "Gaurav Sen",
      category: "youtube",
      justification: "Excellent visual explanations of system design concepts and real-world architectures.",
      bestFor: "Visual learners who want concise explanations",
      estimatedTime: "10 hours",
      cost: "Free",
      confidence: "HIGH",
      url: "https://www.youtube.com/c/GauravSensei",
    },
    ...extraResources,
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STUDY 1: DESIGN YOUTUBE
// ════════════════════════════════════════════════════════════════════════════

function buildYouTube() {
  return {
    topic: "Design: YouTube (Detailed)",
    category: "System Design Cases",
    plan: {
      overview:
        "A deep-dive case study into designing YouTube — the world's largest video streaming platform serving 2B+ monthly active users. Covers video upload pipeline, adaptive bitrate streaming, recommendation engine, and global CDN architecture.",
      skippedTopics: "Ad auction system, YouTube Music, YouTube TV, creator monetization details",
      sessions: [
        {
          sessionNumber: 1,
          title: "Requirements & Back-of-Envelope Estimation",
          paretoJustification:
            "Requirements gathering and estimation are the first 5 minutes of any system design interview — getting them right frames the entire discussion.",
          objectives: [
            "Define functional and non-functional requirements for a video streaming platform",
            "Calculate DAU, QPS, storage, and bandwidth requirements",
            "Identify the most critical system constraints",
          ],
          activities: [
            { description: "List all functional requirements (upload, stream, search, comment, subscribe)", durationMinutes: 10 },
            { description: "Define non-functional requirements (latency, availability, durability)", durationMinutes: 10 },
            { description: "Perform back-of-envelope calculations for YouTube-scale", durationMinutes: 20 },
            { description: "Design initial API endpoints", durationMinutes: 15 },
          ],
          resources: [
            { title: "YouTube Engineering Blog", type: "blog" },
            { title: "System Design Interview - Alex Xu Ch.14", type: "book" },
          ],
          reviewQuestions: [
            "What are the top 3 functional requirements for a video streaming platform?",
            "If YouTube has 2B MAU and 30% are daily active, what is the DAU?",
            "If the average video is 5 minutes at 720p (2.5MB/min), how much storage per day for 500 hours/min of uploads?",
            "Why is availability more important than consistency for a video platform?",
          ],
          successCriteria: "Can produce a complete estimation table and prioritized requirements list in under 10 minutes.",
        },
        {
          sessionNumber: 2,
          title: "High-Level Architecture & Component Design",
          paretoJustification:
            "The high-level architecture diagram is the backbone of every system design answer — interviewers judge your ability to decompose a complex system into manageable components.",
          objectives: [
            "Design the high-level architecture with all major components",
            "Understand the video upload and processing pipeline",
            "Identify the read-heavy nature and design accordingly",
          ],
          activities: [
            { description: "Draw high-level architecture: Client -> LB -> API Gateway -> Services -> Storage", durationMinutes: 15 },
            { description: "Design the video upload pipeline: upload -> transcode -> CDN", durationMinutes: 20 },
            { description: "Design the video streaming flow: request -> CDN -> origin", durationMinutes: 15 },
            { description: "Identify all microservices and their responsibilities", durationMinutes: 10 },
          ],
          resources: [
            { title: "YouTube System Architecture - InfoQ", type: "blog" },
            { title: "Vitess: YouTube's MySQL Sharding", type: "docs" },
          ],
          reviewQuestions: [
            "What are the main microservices in a YouTube-like system?",
            "Why do we need a separate upload service and streaming service?",
            "What role does the API Gateway play in the architecture?",
            "How does the CDN reduce load on origin servers?",
          ],
          successCriteria: "Can draw a complete architecture diagram with 8+ components and explain data flow for upload and streaming.",
        },
        {
          sessionNumber: 3,
          title: "Database Design & Storage Strategy",
          paretoJustification:
            "Database design determines system performance at scale. YouTube uses a mix of SQL (Vitess/MySQL), NoSQL (Bigtable), and blob storage — understanding when to use each is critical.",
          objectives: [
            "Design the database schema for users, videos, and metadata",
            "Choose appropriate storage systems for different data types",
            "Understand YouTube's real technology choices (Vitess, Bigtable, GCS)",
          ],
          activities: [
            { description: "Design SQL schema: users, videos, channels, subscriptions, comments", durationMinutes: 20 },
            { description: "Choose storage: SQL for metadata, blob store for video files, Bigtable for analytics", durationMinutes: 15 },
            { description: "Design indexing strategy for video search and discovery", durationMinutes: 15 },
            { description: "Plan data partitioning and sharding strategy", durationMinutes: 15 },
          ],
          resources: [
            { title: "Vitess - Database Clustering for YouTube", type: "docs" },
            { title: "Google Bigtable Paper", type: "docs" },
          ],
          reviewQuestions: [
            "Why does YouTube use Vitess instead of plain MySQL?",
            "What is the difference between storing video metadata and video files?",
            "How would you shard the videos table — by video_id or by user_id?",
            "Why is Bigtable a good choice for view count and analytics data?",
          ],
          successCriteria: "Can design a complete schema with proper indexing and justify storage technology choices.",
        },
        {
          sessionNumber: 4,
          title: "API Design (REST & gRPC Endpoints)",
          paretoJustification:
            "Well-designed APIs are the contract between frontend and backend — interviewers evaluate your ability to design clean, scalable API surfaces.",
          objectives: [
            "Design RESTful APIs for video upload, streaming, and interaction",
            "Handle pagination, filtering, and rate limiting",
            "Understand when to use REST vs gRPC for internal communication",
          ],
          activities: [
            { description: "Design video CRUD APIs: upload, get, update, delete", durationMinutes: 15 },
            { description: "Design feed and search APIs with pagination", durationMinutes: 15 },
            { description: "Design interaction APIs: like, comment, subscribe", durationMinutes: 10 },
            { description: "Implement API rate limiting and authentication", durationMinutes: 15 },
          ],
          resources: [
            { title: "YouTube Data API v3 Documentation", type: "docs" },
            { title: "gRPC vs REST - When to use which", type: "blog" },
          ],
          reviewQuestions: [
            "How would you design the video upload API to handle large files?",
            "What pagination strategy would you use for the video feed — offset or cursor?",
            "Why might internal services use gRPC instead of REST?",
            "How do you handle partial failures in a video upload?",
          ],
          successCriteria: "Can design 10+ API endpoints with proper request/response schemas and error handling.",
        },
        {
          sessionNumber: 5,
          title: "Video Processing Pipeline & Transcoding",
          paretoJustification:
            "The video processing pipeline is YouTube's core differentiator — understanding transcoding, adaptive bitrate streaming, and DAG-based processing shows deep technical knowledge.",
          objectives: [
            "Design the video transcoding pipeline (multiple resolutions and codecs)",
            "Understand adaptive bitrate streaming (DASH/HLS)",
            "Design a DAG-based processing pipeline for parallel transcoding",
          ],
          activities: [
            { description: "Design the transcoding workflow: original -> 240p/360p/480p/720p/1080p/4K", durationMinutes: 15 },
            { description: "Implement DAG-based parallel processing for video/audio/thumbnail extraction", durationMinutes: 20 },
            { description: "Design adaptive bitrate streaming with manifest files", durationMinutes: 15 },
            { description: "Handle transcoding failures, retries, and dead letter queues", durationMinutes: 10 },
          ],
          resources: [
            { title: "Netflix Video Encoding Pipeline", type: "blog" },
            { title: "HLS vs DASH Streaming Protocols", type: "docs" },
          ],
          reviewQuestions: [
            "What is adaptive bitrate streaming and why is it important?",
            "How does a DAG-based pipeline improve transcoding throughput?",
            "What happens if transcoding fails for one resolution?",
            "Why does YouTube transcode to multiple codecs (H.264, VP9, AV1)?",
          ],
          successCriteria: "Can design a complete transcoding pipeline with parallel processing and failure handling.",
        },
        {
          sessionNumber: 6,
          title: "Caching Strategy & CDN Architecture",
          paretoJustification:
            "YouTube serves 1B+ hours of video daily — without proper caching and CDN architecture, the system would collapse. This is the most impactful performance optimization.",
          objectives: [
            "Design a multi-layer caching strategy (browser, CDN, application, database)",
            "Understand CDN architecture for global video delivery",
            "Handle cache invalidation for dynamic content",
          ],
          activities: [
            { description: "Design CDN distribution: edge servers, regional POPs, origin", durationMinutes: 15 },
            { description: "Implement application-level caching: Redis for metadata, Memcached for sessions", durationMinutes: 15 },
            { description: "Design cache invalidation strategies for different data types", durationMinutes: 15 },
            { description: "Calculate cache hit ratios and cost-benefit analysis", durationMinutes: 10 },
          ],
          resources: [
            { title: "Google Global Cache (GGC) Architecture", type: "docs" },
            { title: "CDN Design Patterns", type: "blog" },
          ],
          reviewQuestions: [
            "What is the difference between a CDN edge server and an origin server?",
            "How would you cache video metadata vs video content differently?",
            "What cache invalidation strategy works best for view counts?",
            "How does YouTube use ISP-level caching (Google Global Cache)?",
          ],
          successCriteria: "Can design a 4-layer caching architecture and calculate expected hit ratios.",
        },
        {
          sessionNumber: 7,
          title: "Scalability & Load Balancing",
          paretoJustification:
            "Scaling from 1M to 2B users requires fundamentally different architectures — demonstrating this understanding separates senior candidates from junior ones.",
          objectives: [
            "Design horizontal scaling for stateless services",
            "Implement database sharding with Vitess",
            "Design load balancing at multiple layers (DNS, L4, L7)",
          ],
          activities: [
            { description: "Design auto-scaling policies for upload and streaming services", durationMinutes: 15 },
            { description: "Implement database sharding: by video_id for videos, by user_id for user data", durationMinutes: 20 },
            { description: "Design multi-layer load balancing: DNS -> L4 (TCP) -> L7 (HTTP)", durationMinutes: 15 },
            { description: "Handle hot partitions (viral videos) with read replicas", durationMinutes: 10 },
          ],
          resources: [
            { title: "Vitess: Scaling MySQL at YouTube", type: "docs" },
            { title: "Load Balancing at Scale - Google SRE Book", type: "book" },
          ],
          reviewQuestions: [
            "How does Vitess help YouTube scale MySQL horizontally?",
            "What happens when a video goes viral and one shard gets all the traffic?",
            "Why use L4 load balancing for video streaming but L7 for API requests?",
            "How do you handle cross-shard queries (e.g., a user's watch history spans multiple shards)?",
          ],
          successCriteria: "Can design a sharding strategy and explain how to handle hot partitions.",
        },
        {
          sessionNumber: 8,
          title: "Reliability, Monitoring & Failure Handling",
          paretoJustification:
            "At YouTube's scale, failures are not 'if' but 'when' — designing for graceful degradation and fast recovery shows production-readiness.",
          objectives: [
            "Design failure handling for each component",
            "Implement monitoring, alerting, and SLOs",
            "Plan for disaster recovery and data durability",
          ],
          activities: [
            { description: "Design circuit breakers for service-to-service communication", durationMinutes: 15 },
            { description: "Define SLOs: 99.99% availability for streaming, 99.9% for uploads", durationMinutes: 10 },
            { description: "Design monitoring dashboards: latency, error rates, throughput", durationMinutes: 15 },
            { description: "Plan disaster recovery: multi-region replication, backup strategies", durationMinutes: 15 },
          ],
          resources: [
            { title: "Google SRE Book - Chapter on YouTube", type: "book" },
            { title: "Designing for Failure - AWS Well-Architected", type: "docs" },
          ],
          reviewQuestions: [
            "What happens if the transcoding service goes down? How do you handle the backlog?",
            "What SLO would you set for video streaming latency?",
            "How do you detect and mitigate a CDN cache poisoning attack?",
            "What is the difference between RTO and RPO for disaster recovery?",
          ],
          successCriteria: "Can design a comprehensive reliability strategy with specific SLOs, monitoring, and DR plans.",
        },
      ],
    },
    quizBank: [
      {
        question: "YouTube has approximately how many monthly active users?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Remember",
        options: ["500 million", "1 billion", "2 billion", "5 billion"],
        correctAnswer: "2 billion",
        explanation:
          "YouTube has over 2 billion monthly active users as of 2024, making it the second most visited website in the world after Google Search. This massive scale drives every architectural decision.",
      },
      {
        question: "How much video content is uploaded to YouTube every minute?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Remember",
        options: ["50 hours", "100 hours", "500 hours", "1000 hours"],
        correctAnswer: "500 hours",
        explanation:
          "Over 500 hours of video are uploaded to YouTube every minute. This means the upload pipeline must handle massive throughput — approximately 8.3 hours of content per second, requiring a robust transcoding infrastructure.",
      },
      {
        question: "What database sharding solution does YouTube use for MySQL?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Remember",
        options: ["Citus", "Vitess", "ProxySQL", "ShardingSphere"],
        correctAnswer: "Vitess",
        explanation:
          "YouTube developed Vitess to horizontally shard MySQL. Vitess provides connection pooling, query routing, and online schema changes across thousands of MySQL instances. It is now an open-source CNCF project.",
      },
      {
        question: "Which streaming protocol allows the client to dynamically switch video quality based on network conditions?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: ["RTMP", "WebRTC", "Adaptive Bitrate Streaming (HLS/DASH)", "FTP"],
        correctAnswer: "Adaptive Bitrate Streaming (HLS/DASH)",
        explanation:
          "Adaptive Bitrate Streaming (ABR) protocols like HLS and DASH allow the client to switch between different quality levels (240p to 4K) based on available bandwidth. The video is split into small segments (2-10 seconds), each available in multiple resolutions.",
      },
      {
        question: "Why does YouTube transcode uploaded videos into multiple resolutions?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "To reduce storage costs",
          "To support adaptive bitrate streaming across different devices and network speeds",
          "To comply with copyright laws",
          "To make videos load faster on the server side",
        ],
        correctAnswer: "To support adaptive bitrate streaming across different devices and network speeds",
        explanation:
          "Transcoding into multiple resolutions (240p, 360p, 480p, 720p, 1080p, 4K) allows adaptive bitrate streaming. A user on a slow mobile connection gets 360p, while someone on fiber gets 4K. This maximizes quality of experience for every user.",
      },
      {
        question: "For YouTube's video metadata, which is a better storage choice and why?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "NoSQL (MongoDB) because video metadata is unstructured",
          "SQL (MySQL/Vitess) because metadata has relational properties (user -> videos, video -> comments)",
          "File system because metadata is small",
          "In-memory only (Redis) for fastest access",
        ],
        correctAnswer: "SQL (MySQL/Vitess) because metadata has relational properties (user -> videos, video -> comments)",
        explanation:
          "Video metadata (title, description, channel, tags) has strong relational properties — a video belongs to a user, has comments from many users, and relates to subscriptions. YouTube actually uses MySQL via Vitess for this. Bigtable is used for analytics/time-series data like view counts.",
      },
      {
        question: "What is Google Global Cache (GGC) and why is it important for YouTube?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "A browser-based caching plugin",
          "CDN servers placed inside ISP networks to serve popular YouTube content locally",
          "A database caching layer using Redis",
          "A DNS caching service",
        ],
        correctAnswer: "CDN servers placed inside ISP networks to serve popular YouTube content locally",
        explanation:
          "Google Global Cache (GGC) places cache servers directly inside ISP data centers. When users request popular videos, the content is served from their ISP's local cache instead of traveling across the internet. This reduces bandwidth costs for ISPs and latency for users.",
      },
      {
        question: "If YouTube has 600M DAU and each user watches 5 videos/day, what is the read QPS?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Apply",
        options: ["~35,000 QPS", "~70,000 QPS", "~350,000 QPS", "~3,500,000 QPS"],
        correctAnswer: "~35,000 QPS",
        explanation:
          "600M DAU x 5 videos/day = 3B requests/day. 3B / 86400 seconds = ~34,722 QPS. However, this is the average — peak QPS could be 2-3x higher. Additionally, each video view generates multiple API calls (metadata, recommendations, ads), so actual QPS is much higher.",
      },
      {
        question: "In a DAG-based video processing pipeline, what is the advantage of using a directed acyclic graph?",
        format: "mcq",
        difficulty: 4,
        bloomLabel: "Analyze",
        options: [
          "It ensures videos are processed in alphabetical order",
          "It allows independent tasks (audio extraction, thumbnail generation, transcoding) to run in parallel while respecting dependencies",
          "It prevents any task from failing",
          "It reduces the total number of tasks needed",
        ],
        correctAnswer: "It allows independent tasks (audio extraction, thumbnail generation, transcoding) to run in parallel while respecting dependencies",
        explanation:
          "A DAG-based pipeline models tasks as nodes and dependencies as edges. Independent tasks (e.g., extract audio, generate thumbnails, transcode to 720p, transcode to 1080p) run in parallel. Tasks that depend on others (e.g., 'add watermark' depends on 'transcode') wait for their dependencies. This maximizes throughput while maintaining correctness.",
      },
      {
        question: "What happens when a YouTube video goes viral and one database shard receives disproportionate traffic?",
        format: "mcq",
        difficulty: 4,
        bloomLabel: "Analyze",
        options: [
          "The system crashes and the video becomes unavailable",
          "Read replicas absorb the read traffic, and caching at multiple layers (CDN, application) reduces database load",
          "The video is automatically deleted to protect the system",
          "All traffic is rerouted to a single powerful server",
        ],
        correctAnswer: "Read replicas absorb the read traffic, and caching at multiple layers (CDN, application) reduces database load",
        explanation:
          "Hot partitions from viral videos are handled through multiple strategies: (1) Read replicas for the hot shard absorb read traffic, (2) CDN caches serve the video content, (3) Application-level caching (Redis/Memcached) serves metadata, (4) Database connection pooling via Vitess prevents connection exhaustion. The video file itself is served entirely from CDN, so the database only handles metadata queries.",
      },
      {
        question: "YouTube uses approximately how many hours of video watched per day globally?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Remember",
        options: ["100 million hours", "500 million hours", "1 billion hours", "5 billion hours"],
        correctAnswer: "1 billion hours",
        explanation:
          "YouTube users collectively watch over 1 billion hours of video per day. This staggering number means the CDN infrastructure must deliver petabytes of data continuously across the globe.",
      },
      {
        question: "Why would you choose cursor-based pagination over offset-based pagination for a YouTube video feed?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Evaluate",
        options: [
          "Cursor pagination is simpler to implement",
          "Cursor pagination handles real-time insertions correctly and performs better on large datasets",
          "Offset pagination does not work with SQL databases",
          "Cursor pagination uses less network bandwidth",
        ],
        correctAnswer: "Cursor pagination handles real-time insertions correctly and performs better on large datasets",
        explanation:
          "Offset-based pagination (LIMIT/OFFSET) breaks when new items are inserted — the user sees duplicates or misses items. With YouTube's 500hrs/min upload rate, this is a real problem. Cursor-based pagination uses a pointer (e.g., last video timestamp or ID) so the query always picks up where it left off, regardless of new insertions. It also avoids the performance penalty of OFFSET on large tables.",
      },
      {
        question: "What codec is YouTube increasingly adopting for better compression at the same quality?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Remember",
        options: ["H.264", "VP8", "AV1", "MPEG-2"],
        correctAnswer: "AV1",
        explanation:
          "YouTube is increasingly using AV1 (Alliance for Open Media Video 1) because it offers ~30% better compression than VP9 and ~50% better than H.264 at the same quality. AV1 is royalty-free, making it cost-effective at YouTube's scale. The trade-off is that encoding is slower and more CPU-intensive.",
      },
      {
        question: "Design a simplified video upload API endpoint. What HTTP method, path, and key headers would you use?",
        format: "open",
        difficulty: 4,
        bloomLabel: "Create",
        explanation:
          "**A good answer includes:** POST /api/v1/videos/upload with Content-Type: multipart/form-data, Authorization: Bearer <token>, and X-Upload-Content-Length header. For large files, use resumable uploads: (1) POST /api/v1/videos/upload/init to get an upload_url, (2) PUT to upload_url with Content-Range headers for chunked upload. This handles network interruptions gracefully. YouTube's real API uses this exact resumable upload pattern.",
      },
      {
        question: "What trade-offs exist between push-based and pull-based feed generation for YouTube's subscription feed?",
        format: "open",
        difficulty: 5,
        bloomLabel: "Evaluate",
        explanation:
          "**Push model (fan-out on write):** When a creator uploads a video, push the video ID to all subscribers' feeds. Pros: Fast read (pre-computed feed). Cons: Expensive writes for creators with 100M+ subscribers (PewDiePie). **Pull model (fan-out on read):** When a user opens their feed, query all subscribed channels for recent videos. Pros: No write amplification. Cons: Slow reads, especially if subscribing to 500+ channels. **Hybrid (YouTube's approach):** Push for creators with <100K subscribers (most creators), pull + cache for mega-creators. This balances write costs and read latency. Celebrity posts are cached aggressively so pull is fast.",
      },
    ],
    cheatSheet: `# Design YouTube - Cheat Sheet

## Scale Numbers
| Metric | Value |
|--------|-------|
| MAU | 2B+ |
| DAU | ~800M |
| Videos uploaded/min | 500 hours |
| Hours watched/day | 1B |
| Average video size (post-transcode) | ~50MB per resolution |
| Total storage | Exabytes |

## Core Components
- **Upload Service** - handles multipart/resumable uploads
- **Transcoding Service** - DAG-based pipeline (FFmpeg workers)
- **Streaming Service** - HLS/DASH adaptive bitrate delivery
- **Metadata Service** - CRUD for video info (MySQL/Vitess)
- **Search Service** - Elasticsearch for video discovery
- **Recommendation Service** - ML-based personalized feed
- **CDN** - Google Global Cache + edge POPs worldwide
- **Notification Service** - pub/sub for subscriber alerts

## Technology Choices
| Component | Technology | Why |
|-----------|-----------|-----|
| Metadata DB | MySQL + Vitess | Relational data, horizontal sharding |
| Analytics | Bigtable | High-write time-series (view counts) |
| Video Storage | Google Cloud Storage | Blob storage, durability |
| Cache | Redis + Memcached | Metadata + session caching |
| Message Queue | Pub/Sub (Kafka-like) | Async transcoding jobs |
| Search | Elasticsearch | Full-text video search |
| CDN | Google GGC + ISP peering | Global video delivery |

## Key API Endpoints
\`\`\`
POST   /api/v1/videos/upload/init    -> {upload_url, video_id}
PUT    /api/v1/videos/upload/{id}     -> chunked upload
GET    /api/v1/videos/{id}            -> video metadata
GET    /api/v1/videos/{id}/stream     -> manifest file (HLS/DASH)
GET    /api/v1/feed?cursor=xxx        -> subscription feed
POST   /api/v1/videos/{id}/like       -> like/dislike
GET    /api/v1/search?q=xxx&cursor=   -> search results
\`\`\`

## Database Schema (Key Tables)
\`\`\`sql
users(id, name, email, avatar_url, created_at)
channels(id, user_id, name, subscriber_count)
videos(id, channel_id, title, description, status, duration, upload_url, created_at)
video_resolutions(video_id, resolution, codec, url, size_bytes)
subscriptions(user_id, channel_id, created_at)
comments(id, video_id, user_id, parent_id, text, created_at)
\`\`\`

## Interview Tips
1. Start with requirements + estimation (5 min)
2. Draw high-level architecture (10 min)
3. Deep dive into upload pipeline OR streaming (15 min)
4. Discuss scaling + caching (10 min)
5. Always mention: CDN, adaptive bitrate, async transcoding
`,
    ladder: buildLadder("YouTube"),
    resources: buildResources("YouTube", [
      {
        title: "YouTube Engineering Blog",
        author: "Google",
        category: "blogs",
        justification: "First-hand insights into how YouTube solves engineering challenges at scale.",
        bestFor: "Understanding real-world decisions behind YouTube's architecture",
        estimatedTime: "5 hours",
        cost: "Free",
        confidence: "HIGH",
        url: "https://blog.youtube/engineering-and-developers/",
      },
    ]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STUDY 2: DESIGN INSTAGRAM
// ════════════════════════════════════════════════════════════════════════════

function buildInstagram() {
  return {
    topic: "Design: Instagram (Detailed)",
    category: "System Design Cases",
    plan: {
      overview:
        "A comprehensive case study on designing Instagram — a photo and short-video sharing social network with 2B+ MAU. Covers news feed generation (fan-out), image processing pipeline, Stories architecture, and social graph storage.",
      skippedTopics: "Instagram Shopping, Reels recommendation ML model, ad targeting, Instagram Threads",
      sessions: [
        {
          sessionNumber: 1,
          title: "Requirements & Back-of-Envelope Estimation",
          paretoJustification: "Accurate estimation at Instagram's scale reveals the read-heavy nature (100:1 read-to-write ratio) that drives every design decision.",
          objectives: [
            "Define functional requirements: post, follow, feed, stories, search, explore",
            "Calculate DAU, QPS, storage for images/videos, and bandwidth",
            "Identify that Instagram is extremely read-heavy",
          ],
          activities: [
            { description: "List functional requirements and prioritize for MVP", durationMinutes: 10 },
            { description: "Calculate: 2B MAU, ~500M DAU, avg 3 posts viewed per session, 10 sessions/day", durationMinutes: 15 },
            { description: "Storage estimation: 100M photos/day * 2MB avg = 200TB/day", durationMinutes: 15 },
            { description: "Define API contracts for post creation and feed retrieval", durationMinutes: 15 },
          ],
          resources: [
            { title: "Instagram Engineering Blog", type: "blog" },
            { title: "System Design Interview - Alex Xu Ch.11", type: "book" },
          ],
          reviewQuestions: [
            "What is Instagram's read-to-write ratio and why does it matter?",
            "If 100M photos are uploaded daily at 2MB each, how much storage per year?",
            "Why is eventual consistency acceptable for the news feed?",
            "What are the top 3 non-functional requirements for Instagram?",
          ],
          successCriteria: "Can produce estimation table and identify the system as read-heavy with eventual consistency.",
        },
        {
          sessionNumber: 2,
          title: "High-Level Architecture",
          paretoJustification: "Instagram's architecture separates the write path (post creation) from the read path (feed generation) — this fundamental split is reusable across many social media designs.",
          objectives: [
            "Design the high-level architecture separating read and write paths",
            "Identify key services: Post, Feed, User, Story, Notification, Search",
            "Understand Instagram's real tech stack (Django, Cassandra, PostgreSQL, Redis)",
          ],
          activities: [
            { description: "Draw architecture: clients -> CDN/LB -> API servers -> services -> storage", durationMinutes: 15 },
            { description: "Design write path: post creation -> fan-out -> feed cache", durationMinutes: 15 },
            { description: "Design read path: feed request -> cache -> merge -> rank", durationMinutes: 15 },
            { description: "Map services to storage systems", durationMinutes: 10 },
          ],
          resources: [
            { title: "Instagram Engineering: Scaling to 14M Users in a Year", type: "blog" },
            { title: "Cassandra at Instagram", type: "blog" },
          ],
          reviewQuestions: [
            "Why does Instagram separate the write path from the read path?",
            "What is the role of the fan-out service?",
            "Why did Instagram choose Django (Python) for their backend?",
            "How do Stories differ architecturally from regular posts?",
          ],
          successCriteria: "Can draw a complete architecture with separated read/write paths and 6+ services.",
        },
        {
          sessionNumber: 3,
          title: "Database Design & Storage",
          paretoJustification: "Instagram uses PostgreSQL for user data, Cassandra for feed storage, and S3 for images — understanding this polyglot persistence is essential for system design interviews.",
          objectives: [
            "Design schemas for users, posts, follows, and feed",
            "Understand why Instagram uses multiple database types",
            "Plan image storage with CDN integration",
          ],
          activities: [
            { description: "Design PostgreSQL schema: users, posts, comments, likes", durationMinutes: 15 },
            { description: "Design Cassandra schema for feed storage (user_id -> post_ids)", durationMinutes: 15 },
            { description: "Design S3/blob storage for images with CDN caching", durationMinutes: 15 },
            { description: "Plan sharding strategy for each storage system", durationMinutes: 10 },
          ],
          resources: [
            { title: "Sharding & IDs at Instagram", type: "blog" },
            { title: "PostgreSQL at Instagram", type: "blog" },
          ],
          reviewQuestions: [
            "Why use PostgreSQL for user data but Cassandra for the feed?",
            "How does Instagram generate globally unique IDs without coordination?",
            "What is the schema for the feed table in Cassandra?",
            "How are images stored and served efficiently?",
          ],
          successCriteria: "Can design schemas in both SQL and NoSQL and justify the polyglot persistence approach.",
        },
        {
          sessionNumber: 4,
          title: "API Design",
          paretoJustification: "Instagram's APIs must handle image uploads, feed pagination, and real-time features — designing these correctly demonstrates full-stack system thinking.",
          objectives: [
            "Design RESTful APIs for posting, feed, stories, and search",
            "Handle image upload with pre-signed URLs",
            "Implement cursor-based pagination for infinite scroll",
          ],
          activities: [
            { description: "Design post creation API with pre-signed S3 URLs for image upload", durationMinutes: 15 },
            { description: "Design feed API with cursor pagination and ranked results", durationMinutes: 15 },
            { description: "Design Stories API with TTL-based expiration", durationMinutes: 10 },
            { description: "Design search and explore APIs", durationMinutes: 15 },
          ],
          resources: [
            { title: "Instagram Graph API Documentation", type: "docs" },
            { title: "Pre-signed URL Pattern", type: "blog" },
          ],
          reviewQuestions: [
            "Why use pre-signed URLs for image uploads instead of proxying through the API server?",
            "How does cursor-based pagination work for the Instagram feed?",
            "How do you handle Stories that expire after 24 hours at the API level?",
            "What rate limiting would you apply to the post creation endpoint?",
          ],
          successCriteria: "Can design complete API surface with proper upload pattern and pagination.",
        },
        {
          sessionNumber: 5,
          title: "News Feed Generation (Fan-out)",
          paretoJustification: "Feed generation is THE core algorithm for any social media platform. The fan-out-on-write vs fan-out-on-read trade-off appears in almost every FAANG interview.",
          objectives: [
            "Understand fan-out-on-write vs fan-out-on-read",
            "Design Instagram's hybrid fan-out approach",
            "Implement feed ranking with ML signals",
          ],
          activities: [
            { description: "Analyze fan-out-on-write: push post to all followers' feeds at write time", durationMinutes: 15 },
            { description: "Analyze fan-out-on-read: pull posts from followed users at read time", durationMinutes: 10 },
            { description: "Design hybrid approach: push for normal users, pull for celebrities", durationMinutes: 15 },
            { description: "Design feed ranking: engagement prediction, recency, relationship strength", durationMinutes: 15 },
          ],
          resources: [
            { title: "Facebook News Feed Architecture", type: "blog" },
            { title: "Feed Ranking at Instagram", type: "blog" },
          ],
          reviewQuestions: [
            "What is the celebrity problem in fan-out-on-write?",
            "How does Instagram's hybrid fan-out approach work?",
            "What signals does Instagram use to rank feed items?",
            "How would you handle a user with 100M followers posting?",
          ],
          successCriteria: "Can explain both fan-out strategies and design a hybrid approach with ranking.",
        },
        {
          sessionNumber: 6,
          title: "Caching & Performance",
          paretoJustification: "Instagram reportedly caches 60TB+ of data in Memcached — understanding what to cache and how to invalidate it is critical for any read-heavy system.",
          objectives: [
            "Design multi-layer caching for feed, user profiles, and images",
            "Understand Instagram's use of Memcached at scale",
            "Handle cache stampede and thundering herd problems",
          ],
          activities: [
            { description: "Design cache layers: CDN (images), Redis (feeds), Memcached (user/post data)", durationMinutes: 15 },
            { description: "Implement cache-aside pattern for user profiles", durationMinutes: 10 },
            { description: "Handle thundering herd: lease-based caching, stale-while-revalidate", durationMinutes: 15 },
            { description: "Design cache warming and pre-computation strategies", durationMinutes: 15 },
          ],
          resources: [
            { title: "Scaling Memcached at Facebook", type: "blog" },
            { title: "TAO: Facebook's Distributed Data Store for the Social Graph", type: "blog" },
          ],
          reviewQuestions: [
            "What is the thundering herd problem and how do you prevent it?",
            "Why does Instagram use both Redis and Memcached?",
            "How do you invalidate the feed cache when a new post is created?",
            "What is the cache-aside pattern and when would you use it?",
          ],
          successCriteria: "Can design a multi-layer caching strategy and handle common caching pitfalls.",
        },
        {
          sessionNumber: 7,
          title: "Scalability & Data Partitioning",
          paretoJustification: "Instagram grew from 0 to 1B users — understanding their scaling journey reveals practical lessons about when to shard, when to add replicas, and when to redesign.",
          objectives: [
            "Design horizontal scaling for stateless API servers",
            "Implement database sharding strategies",
            "Handle the social graph at scale with TAO-like architecture",
          ],
          activities: [
            { description: "Design auto-scaling for API servers behind load balancers", durationMinutes: 10 },
            { description: "Implement PostgreSQL sharding by user_id with consistent hashing", durationMinutes: 20 },
            { description: "Design the social graph storage (followers/following) for fast lookups", durationMinutes: 15 },
            { description: "Handle cross-shard operations (e.g., exploring popular posts across all users)", durationMinutes: 15 },
          ],
          resources: [
            { title: "Sharding at Instagram", type: "blog" },
            { title: "Consistent Hashing Explained", type: "blog" },
          ],
          reviewQuestions: [
            "How does Instagram shard PostgreSQL and manage cross-shard queries?",
            "What is consistent hashing and why is it better than modulo hashing?",
            "How do you store the social graph (who follows whom) efficiently?",
            "What challenges arise when a user's data spans multiple shards?",
          ],
          successCriteria: "Can design a sharding strategy with consistent hashing and handle cross-shard queries.",
        },
        {
          sessionNumber: 8,
          title: "Reliability & Monitoring",
          paretoJustification: "Instagram serves billions of requests daily — failure handling and monitoring are what keep the service running at 99.99% availability.",
          objectives: [
            "Design failure handling for each critical path",
            "Implement monitoring and alerting with SLOs",
            "Plan capacity and handle traffic spikes (e.g., New Year's Eve)",
          ],
          activities: [
            { description: "Design graceful degradation: serve stale feed if feed service is down", durationMinutes: 15 },
            { description: "Implement circuit breakers between services", durationMinutes: 10 },
            { description: "Define SLOs and error budgets for key user journeys", durationMinutes: 15 },
            { description: "Plan for predictable traffic spikes and capacity provisioning", durationMinutes: 15 },
          ],
          resources: [
            { title: "Reliability at Instagram", type: "blog" },
            { title: "Site Reliability Engineering - Google", type: "book" },
          ],
          reviewQuestions: [
            "How would you handle a feed service outage gracefully?",
            "What SLO would you set for image upload latency?",
            "How do you prepare for predictable traffic spikes like New Year's Eve?",
            "What metrics would you monitor for the fan-out service?",
          ],
          successCriteria: "Can design reliability strategies for each critical path with specific SLOs.",
        },
      ],
    },
    quizBank: [
      {
        question: "Instagram uses which approach for news feed generation?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: ["Fan-out on write only", "Fan-out on read only", "Hybrid: push for normal users, pull for celebrities", "No fan-out — direct database query"],
        correctAnswer: "Hybrid: push for normal users, pull for celebrities",
        explanation: "Instagram uses a hybrid approach. For regular users (< ~10K followers), new posts are pushed to all followers' feed caches (fan-out on write). For celebrities with millions of followers, posts are pulled at read time to avoid massive write amplification. This balances write cost and read latency.",
      },
      {
        question: "Why did Instagram choose Cassandra for storing the user feed?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "Cassandra supports complex SQL joins",
          "Cassandra excels at high-throughput writes and time-ordered queries (perfect for feed storage)",
          "Cassandra is the cheapest database option",
          "Cassandra has built-in image storage",
        ],
        correctAnswer: "Cassandra excels at high-throughput writes and time-ordered queries (perfect for feed storage)",
        explanation: "The feed is essentially a time-ordered list of post IDs per user. Cassandra's write-optimized LSM-tree storage and native support for clustering keys (ordering by timestamp) make it ideal. A single row per user with posts ordered by time enables efficient feed reads with a single partition query.",
      },
      {
        question: "What is the 'celebrity problem' in feed generation?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "Celebrities post too many photos",
          "When a celebrity with millions of followers posts, fan-out-on-write creates millions of write operations",
          "Celebrity accounts use too much storage",
          "Celebrity photos get too many likes for the database to handle",
        ],
        correctAnswer: "When a celebrity with millions of followers posts, fan-out-on-write creates millions of write operations",
        explanation: "If Cristiano Ronaldo (600M+ followers) posts a photo and we use pure fan-out-on-write, we need to write to 600M+ feed caches. This creates enormous write amplification, high latency for the celebrity's post to appear, and wastes resources since most followers may not check their feed that day.",
      },
      {
        question: "How does Instagram generate unique IDs without a central coordinator?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Auto-increment in PostgreSQL",
          "UUIDs (128-bit random)",
          "Snowflake-like: timestamp + shard_id + sequence (64-bit)",
          "Hash of the image content",
        ],
        correctAnswer: "Snowflake-like: timestamp + shard_id + sequence (64-bit)",
        explanation: "Instagram uses a Snowflake-inspired ID generation scheme: 41 bits for timestamp (milliseconds since custom epoch), 13 bits for shard ID, and 10 bits for auto-incrementing sequence. This produces 64-bit IDs that are roughly time-sorted (great for feeds), globally unique, and generated locally on each shard without coordination.",
      },
      {
        question: "What is a pre-signed URL and why does Instagram use it for image uploads?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "A URL that expires — it allows clients to upload directly to S3, bypassing the API server and reducing bandwidth costs",
          "A URL with a digital signature for copyright protection",
          "A URL that compresses images before upload",
          "A shortened URL for sharing on social media",
        ],
        correctAnswer: "A URL that expires — it allows clients to upload directly to S3, bypassing the API server and reducing bandwidth costs",
        explanation: "Pre-signed URLs let the API server generate a temporary, authenticated URL for S3. The client uploads the image directly to S3 using this URL, so the large image data never passes through the API server. This reduces API server bandwidth, CPU usage, and latency. The URL expires after a short time for security.",
      },
      {
        question: "Instagram reportedly uses how much data in their Memcached cluster?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Remember",
        options: ["1 TB", "10 TB", "60+ TB", "500 TB"],
        correctAnswer: "60+ TB",
        explanation: "Instagram reportedly uses over 60TB of data cached in Memcached across their infrastructure. This massive cache stores user profiles, post metadata, social graph lookups, and pre-computed feed data. The cache hit ratio is critical — even a 1% drop in hit ratio at Instagram's scale would overwhelm the databases.",
      },
      {
        question: "What is the thundering herd problem in caching?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Too many cache servers running simultaneously",
          "When a popular cache entry expires, thousands of requests simultaneously hit the database to regenerate it",
          "When cache memory is full and starts evicting entries",
          "When the CDN receives too many requests from one region",
        ],
        correctAnswer: "When a popular cache entry expires, thousands of requests simultaneously hit the database to regenerate it",
        explanation: "When a highly popular cache entry (e.g., a celebrity's profile) expires, thousands of concurrent requests find the cache empty and all query the database simultaneously. This can overwhelm the database. Solutions include: lease-based locking (only one request regenerates the cache), stale-while-revalidate (serve stale data while regenerating), and probabilistic early expiration.",
      },
      {
        question: "If Instagram has 500M DAU, each viewing 30 photos/day at 500KB average, what is the daily bandwidth for image serving?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Apply",
        options: ["~750 TB/day", "~7.5 PB/day", "~75 PB/day", "~750 PB/day"],
        correctAnswer: "~7.5 PB/day",
        explanation: "500M DAU x 30 photos x 500KB = 7.5 x 10^15 bytes = 7.5 PB/day. This is why a global CDN is essential — serving 7.5 petabytes daily from origin servers would be impossible. With CDN cache hit ratios of 95%+, origin servers only need to serve ~375 TB/day, which is still enormous but manageable.",
      },
      {
        question: "Why does Instagram use both Redis and Memcached instead of just one?",
        format: "mcq",
        difficulty: 4,
        bloomLabel: "Analyze",
        options: [
          "Redis is for images, Memcached is for text",
          "Redis supports data structures (sorted sets for feeds, pub/sub for notifications) while Memcached is simpler/faster for key-value caching of user/post data",
          "They use Redis in production and Memcached in staging",
          "Memcached is free while Redis requires a license",
        ],
        correctAnswer: "Redis supports data structures (sorted sets for feeds, pub/sub for notifications) while Memcached is simpler/faster for key-value caching of user/post data",
        explanation: "Redis and Memcached serve different caching needs. Redis is used where data structure support is needed: sorted sets for ranked feeds, pub/sub for real-time notifications, lists for activity streams. Memcached is used for simple key-value lookups of user profiles, post metadata, and other frequently accessed objects — it has lower overhead per key and better multi-threaded performance for simple gets/sets.",
      },
      {
        question: "How would you design the Explore page that shows personalized content from accounts a user doesn't follow?",
        format: "open",
        difficulty: 5,
        bloomLabel: "Create",
        explanation: "**A strong answer covers:** (1) Candidate generation: find posts liked by users similar to the target user (collaborative filtering), trending posts in user's interest categories, and posts from accounts followed by people the user follows. (2) Ranking: ML model scores candidates based on predicted engagement (like, comment, save probability). Features include: content type, post recency, creator quality score, user-content affinity. (3) Diversity: inject posts from new categories to avoid filter bubbles. (4) Architecture: pre-compute candidate pools in batch (Spark), rank in real-time (low-latency ML serving), cache top candidates per user in Redis. Update every few hours for freshness.",
      },
      {
        question: "What is the key difference between how Stories and regular Posts are stored architecturally?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "Stories use a different CDN than Posts",
          "Stories have a 24-hour TTL and are stored with expiration, while Posts are permanent and stored in the main database",
          "Stories are stored on the client only",
          "There is no architectural difference",
        ],
        correctAnswer: "Stories have a 24-hour TTL and are stored with expiration, while Posts are permanent and stored in the main database",
        explanation: "Stories are ephemeral (24-hour TTL), so they are stored with automatic expiration in a system like Cassandra (which supports TTL natively) or Redis with EXPIRE. This means storage is self-cleaning. Posts, on the other hand, are permanent and stored in PostgreSQL with S3 for images. The feed generation also differs — Stories use a separate fan-out optimized for the Stories tray UI.",
      },
      {
        question: "Explain the trade-offs of storing the social graph (followers/following) in a relational database vs a graph database.",
        format: "open",
        difficulty: 4,
        bloomLabel: "Evaluate",
        explanation: "**Relational (PostgreSQL):** Simple followers table (follower_id, following_id, created_at). Pros: ACID transactions, mature tooling, easy sharding by user_id. Cons: Multi-hop queries (friends-of-friends) are expensive (multiple JOINs). Instagram actually uses this approach. **Graph database (Neo4j, TAO):** Natively stores edges between nodes. Pros: Multi-hop traversals are fast (O(1) per hop), natural modeling. Cons: Harder to shard, fewer operational tools, less mature. **Instagram's choice:** PostgreSQL with aggressive caching in TAO-like system. Most queries are 1-hop (get followers, get following), which SQL handles well. The rare 2-hop queries (suggested follows) are pre-computed in batch jobs.",
      },
    ],
    cheatSheet: `# Design Instagram - Cheat Sheet

## Scale Numbers
| Metric | Value |
|--------|-------|
| MAU | 2B+ |
| DAU | ~500M |
| Photos uploaded/day | ~100M |
| Stories created/day | ~500M |
| Average photo size | ~2MB (original), ~500KB (compressed) |
| Read:Write ratio | ~100:1 |

## Core Components
- **Post Service** - photo/video upload, metadata CRUD
- **Feed Service** - fan-out, ranking, feed generation
- **Story Service** - ephemeral content with 24h TTL
- **User Service** - profiles, authentication
- **Social Graph Service** - follow/unfollow, follower lists
- **Search Service** - user search, hashtag search, explore
- **Notification Service** - push notifications, activity feed
- **CDN** - image/video delivery worldwide

## Technology Choices (Real)
| Component | Technology |
|-----------|-----------|
| Backend | Django (Python) |
| User/Post DB | PostgreSQL (sharded) |
| Feed Storage | Cassandra |
| Cache | Redis + Memcached (60+ TB) |
| Image Storage | S3 + CDN |
| Message Queue | RabbitMQ / Celery |
| ID Generation | Snowflake-like (41-bit ts + 13-bit shard + 10-bit seq) |

## Fan-out Strategy (Hybrid)
- **< 10K followers**: Fan-out on write (push to all follower feeds)
- **> 10K followers**: Fan-out on read (pull at feed request time)
- **Feed ranking**: ML model (engagement prediction, recency, relationship)

## Key API Endpoints
\`\`\`
POST   /api/v1/posts              -> create post (pre-signed URL)
GET    /api/v1/feed?cursor=xxx    -> ranked news feed
GET    /api/v1/stories            -> stories from followed users
POST   /api/v1/users/{id}/follow  -> follow user
GET    /api/v1/explore?cursor=xxx -> personalized explore
GET    /api/v1/search?q=xxx       -> search users/hashtags
\`\`\`

## Interview Tips
1. Clarify: photo-only or photo+video+stories?
2. Emphasize the read-heavy nature (100:1 ratio)
3. Fan-out trade-off is THE key discussion point
4. Mention: pre-signed URLs, Snowflake IDs, hybrid fan-out
5. Deep dive: feed ranking algorithm or Stories architecture
`,
    ladder: buildLadder("Instagram"),
    resources: buildResources("Instagram", [
      {
        title: "Instagram Engineering Blog",
        author: "Meta Engineering",
        category: "blogs",
        justification: "Direct from Instagram's engineering team — covers their technical decisions and scaling challenges.",
        bestFor: "Understanding real engineering decisions at Instagram",
        estimatedTime: "5 hours",
        cost: "Free",
        confidence: "HIGH",
        url: "https://instagram-engineering.com/",
      },
    ]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STUDY 3: DESIGN UBER
// ════════════════════════════════════════════════════════════════════════════

function buildUber() {
  return {
    topic: "Design: Uber (Detailed)",
    category: "System Design Cases",
    plan: {
      overview:
        "A comprehensive case study on designing Uber — a real-time ride-sharing platform operating in 10,000+ cities with millions of concurrent rides. Covers location tracking, matching algorithm, surge pricing, ETA calculation, and geospatial indexing.",
      skippedTopics: "Uber Eats, Uber Freight, autonomous vehicles, driver onboarding",
      sessions: [
        {
          sessionNumber: 1,
          title: "Requirements & Back-of-Envelope Estimation",
          paretoJustification: "Uber's real-time nature and geospatial requirements make estimation uniquely challenging — you must account for location updates, matching QPS, and regional traffic patterns.",
          objectives: [
            "Define functional requirements for riders and drivers",
            "Calculate location update QPS, trip QPS, and storage",
            "Understand the real-time constraint (match within seconds)",
          ],
          activities: [
            { description: "List rider requirements: request ride, track driver, payment, rating", durationMinutes: 10 },
            { description: "List driver requirements: go online, accept/reject ride, navigation, earnings", durationMinutes: 10 },
            { description: "Estimate: 20M daily rides, 5M concurrent drivers, location updates every 4 sec", durationMinutes: 15 },
            { description: "Calculate QPS: 5M drivers / 4 sec = 1.25M location updates/sec", durationMinutes: 10 },
          ],
          resources: [
            { title: "Uber Engineering Blog", type: "blog" },
            { title: "System Design Interview Vol 2 - Alex Xu Ch.1", type: "book" },
          ],
          reviewQuestions: [
            "If 5M drivers send location updates every 4 seconds, what is the QPS?",
            "Why is low latency (< 1 second) critical for the matching system?",
            "How much storage is needed for location history of 20M trips/day?",
            "What happens if a match takes more than 30 seconds?",
          ],
          successCriteria: "Can calculate location update QPS and identify real-time matching as the critical constraint.",
        },
        {
          sessionNumber: 2,
          title: "High-Level Architecture",
          paretoJustification: "Uber's architecture uniquely combines real-time location services, matching algorithms, and payment processing — understanding how these interact is key.",
          objectives: [
            "Design the high-level architecture with real-time and batch components",
            "Understand the ride lifecycle: request -> match -> navigate -> complete -> pay",
            "Identify key services and their interactions",
          ],
          activities: [
            { description: "Draw architecture: Rider App, Driver App -> Gateway -> Core Services -> Storage", durationMinutes: 15 },
            { description: "Design the ride lifecycle flow through all services", durationMinutes: 15 },
            { description: "Identify services: Location, Matching, Trip, Pricing, Payment, Notification", durationMinutes: 10 },
            { description: "Design communication patterns: sync (REST) vs async (Kafka) vs real-time (WebSocket)", durationMinutes: 15 },
          ],
          resources: [
            { title: "Uber's Microservice Architecture", type: "blog" },
            { title: "Designing Real-Time Systems", type: "blog" },
          ],
          reviewQuestions: [
            "What are the main microservices in Uber's architecture?",
            "Why does Uber need WebSocket connections for driver location updates?",
            "How does the ride lifecycle flow through the system?",
            "What is the role of Kafka in Uber's architecture?",
          ],
          successCriteria: "Can draw a complete architecture and trace the full ride lifecycle through all services.",
        },
        {
          sessionNumber: 3,
          title: "Database Design & Geospatial Indexing",
          paretoJustification: "Geospatial indexing is the foundation of any location-based service. Understanding geohashing, quadtrees, and spatial databases separates strong candidates from average ones.",
          objectives: [
            "Design schemas for users, drivers, trips, and locations",
            "Understand geospatial indexing: geohash, quadtree, S2 cells",
            "Choose storage: PostgreSQL+PostGIS for geo queries, Redis for real-time location",
          ],
          activities: [
            { description: "Design SQL schema: users, drivers, trips, payments, ratings", durationMinutes: 15 },
            { description: "Implement geohashing for spatial proximity queries", durationMinutes: 20 },
            { description: "Design real-time driver location storage in Redis with geo commands", durationMinutes: 15 },
            { description: "Compare geohash vs quadtree vs Google S2 cells", durationMinutes: 10 },
          ],
          resources: [
            { title: "H3: Uber's Hexagonal Hierarchical Spatial Index", type: "docs" },
            { title: "Geohashing Explained", type: "blog" },
          ],
          reviewQuestions: [
            "What is a geohash and how does it convert 2D coordinates to a 1D string?",
            "Why does Uber use H3 hexagonal indexing instead of standard geohash?",
            "How would you store real-time driver locations for fast proximity queries?",
            "What is the boundary problem with geohashing and how do you solve it?",
          ],
          successCriteria: "Can implement geohashing and explain trade-offs between spatial indexing approaches.",
        },
        {
          sessionNumber: 4,
          title: "API Design & Real-Time Communication",
          paretoJustification: "Uber requires both REST APIs and real-time WebSocket communication — designing this dual-protocol system is a common interview deep-dive.",
          objectives: [
            "Design REST APIs for ride requests, trip management, and payments",
            "Implement WebSocket for real-time driver location and ride status updates",
            "Handle state transitions for ride lifecycle",
          ],
          activities: [
            { description: "Design ride request API: POST /rides with pickup/dropoff locations", durationMinutes: 15 },
            { description: "Design WebSocket protocol for driver location streaming", durationMinutes: 15 },
            { description: "Design trip status API with state machine (requested -> matched -> en_route -> in_progress -> completed)", durationMinutes: 15 },
            { description: "Design payment and rating APIs", durationMinutes: 10 },
          ],
          resources: [
            { title: "Uber API Documentation", type: "docs" },
            { title: "WebSocket vs SSE vs Long Polling", type: "blog" },
          ],
          reviewQuestions: [
            "Why use WebSocket instead of polling for driver location updates?",
            "How do you handle the ride state machine (what states and transitions exist)?",
            "What happens if the WebSocket connection drops during a ride?",
            "How would you design the payment API to be idempotent?",
          ],
          successCriteria: "Can design REST + WebSocket APIs with proper state management for the ride lifecycle.",
        },
        {
          sessionNumber: 5,
          title: "Matching Algorithm & Dispatch System",
          paretoJustification: "The matching/dispatch system is Uber's core competitive advantage. Understanding the algorithm, optimization criteria, and real-time constraints is the most impressive deep-dive you can do.",
          objectives: [
            "Design the driver-rider matching algorithm",
            "Understand multi-criteria optimization: distance, ETA, driver rating, acceptance rate",
            "Handle edge cases: no drivers available, driver cancellation, rider cancellation",
          ],
          activities: [
            { description: "Design the matching flow: find nearby drivers -> rank by score -> dispatch sequentially", durationMinutes: 15 },
            { description: "Implement scoring: weighted function of ETA, distance, rating, trip type", durationMinutes: 15 },
            { description: "Design batched matching for optimizing global efficiency (vs greedy matching)", durationMinutes: 15 },
            { description: "Handle edge cases: timeout, rejection cascading, surge areas", durationMinutes: 10 },
          ],
          resources: [
            { title: "Uber's Dispatch System - OORT", type: "blog" },
            { title: "Matching Algorithms in Ride-Sharing", type: "blog" },
          ],
          reviewQuestions: [
            "Why doesn't Uber just match with the closest driver?",
            "What is the difference between greedy matching and batched matching?",
            "How does the system handle a driver rejecting a ride request?",
            "What factors does the matching score consider beyond distance?",
          ],
          successCriteria: "Can design a multi-criteria matching algorithm with edge case handling.",
        },
        {
          sessionNumber: 6,
          title: "Caching, ETA Calculation & Surge Pricing",
          paretoJustification: "ETA accuracy directly impacts user trust, and surge pricing is the economic engine. Both require sophisticated caching and real-time computation.",
          objectives: [
            "Design ETA calculation using graph algorithms and historical data",
            "Implement surge pricing based on supply-demand imbalance",
            "Cache frequently accessed data: map tiles, ETAs, pricing zones",
          ],
          activities: [
            { description: "Design ETA: Dijkstra's on road graph with real-time traffic weights", durationMinutes: 15 },
            { description: "Implement surge pricing: demand/supply ratio per geohash zone", durationMinutes: 15 },
            { description: "Cache strategy: precomputed ETAs, map tiles, driver locations in Redis", durationMinutes: 15 },
            { description: "Handle cache invalidation for rapidly changing data (driver locations)", durationMinutes: 10 },
          ],
          resources: [
            { title: "Uber ETA Estimation", type: "blog" },
            { title: "Surge Pricing Algorithm Design", type: "blog" },
          ],
          reviewQuestions: [
            "How does Uber calculate ETA using real-time traffic data?",
            "What triggers surge pricing and how is the multiplier calculated?",
            "Why can't you cache driver locations for more than a few seconds?",
            "How would you pre-compute ETAs for common routes?",
          ],
          successCriteria: "Can design ETA calculation and surge pricing with appropriate caching.",
        },
        {
          sessionNumber: 7,
          title: "Scalability & Regional Architecture",
          paretoJustification: "Uber operates in 10,000+ cities — understanding how to partition by geography and handle different scales per region is critical.",
          objectives: [
            "Design geographic partitioning of data and services",
            "Implement per-city and per-region scaling",
            "Handle cross-region trips and data consistency",
          ],
          activities: [
            { description: "Design geographic partitioning: each city/region has its own service cluster", durationMinutes: 15 },
            { description: "Implement sharding by city_id for location data", durationMinutes: 15 },
            { description: "Design global services (user accounts, payments) vs regional services (matching, location)", durationMinutes: 15 },
            { description: "Handle scaling for high-demand events (concerts, sports, holidays)", durationMinutes: 10 },
          ],
          resources: [
            { title: "Uber's Ring Pop - Scalable Sharding", type: "docs" },
            { title: "Regional Architecture at Uber", type: "blog" },
          ],
          reviewQuestions: [
            "Why does Uber partition services by geography rather than just scaling horizontally?",
            "How do you handle a user who takes a ride across city boundaries?",
            "What services are global vs regional in Uber's architecture?",
            "How does Uber scale for a major event like the Super Bowl?",
          ],
          successCriteria: "Can design geographic partitioning with global and regional service separation.",
        },
        {
          sessionNumber: 8,
          title: "Reliability, Safety & Monitoring",
          paretoJustification: "Uber handles real money and real people in real-time — reliability failures directly impact safety and revenue. This session covers production-grade reliability.",
          objectives: [
            "Design failure handling for payment and matching services",
            "Implement safety features: trip sharing, emergency button, anomaly detection",
            "Design monitoring for real-time operations",
          ],
          activities: [
            { description: "Design payment reliability: idempotent charges, retry with exponential backoff", durationMinutes: 15 },
            { description: "Design matching fallback: expand search radius, suggest alternative ride types", durationMinutes: 10 },
            { description: "Implement real-time anomaly detection: unusual routes, driver behavior", durationMinutes: 15 },
            { description: "Design monitoring: match success rate, ETA accuracy, payment success rate", durationMinutes: 15 },
          ],
          resources: [
            { title: "Uber's Reliability Engineering", type: "blog" },
            { title: "Payment Processing at Uber", type: "blog" },
          ],
          reviewQuestions: [
            "How do you ensure a rider is never double-charged for a ride?",
            "What happens if the matching service goes down in a specific city?",
            "How would you detect a driver taking an unusual route?",
            "What are the key SLIs for a ride-sharing platform?",
          ],
          successCriteria: "Can design reliability strategies for real-time, safety-critical operations.",
        },
      ],
    },
    quizBank: [
      {
        question: "What is Uber's H3 spatial indexing system?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "A hash table with 3 levels",
          "A hexagonal hierarchical spatial indexing system that divides the world into hexagonal cells",
          "A 3-dimensional coordinate system",
          "A database with 3 replicas",
        ],
        correctAnswer: "A hexagonal hierarchical spatial indexing system that divides the world into hexagonal cells",
        explanation: "H3 is Uber's open-source geospatial indexing system that divides the Earth's surface into hexagonal cells at multiple resolutions (0-15). Hexagons have uniform distances to neighbors (unlike square grids), making them ideal for proximity queries and surge pricing zone calculations.",
      },
      {
        question: "If 5 million drivers send GPS updates every 4 seconds, what is the location update QPS?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Apply",
        options: ["~125,000", "~250,000", "~1,250,000", "~5,000,000"],
        correctAnswer: "~1,250,000",
        explanation: "5,000,000 drivers / 4 seconds = 1,250,000 QPS for location updates alone. This is an enormous write throughput requirement, which is why Uber uses in-memory stores (Redis with geo commands) rather than traditional databases for real-time location data.",
      },
      {
        question: "Why does Uber use WebSocket connections instead of HTTP polling for driver location updates?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "WebSocket is more secure",
          "WebSocket maintains a persistent bidirectional connection, reducing overhead for frequent small updates",
          "HTTP does not support sending location data",
          "WebSocket uses less battery on mobile phones",
        ],
        correctAnswer: "WebSocket maintains a persistent bidirectional connection, reducing overhead for frequent small updates",
        explanation: "Drivers send location updates every 3-4 seconds. With HTTP, each update would require a full TCP handshake + HTTP headers (~500 bytes overhead for a ~50 byte payload). WebSocket maintains a persistent connection where each message has only ~6 bytes of framing overhead. At 1.25M QPS, this overhead reduction is significant.",
      },
      {
        question: "What is the boundary problem in geohashing?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "Geohashes cannot represent locations near the equator",
          "Two locations very close to each other can have completely different geohash prefixes if they are on opposite sides of a grid boundary",
          "Geohashes run out of precision at high latitudes",
          "Geohash strings are too long to store efficiently",
        ],
        correctAnswer: "Two locations very close to each other can have completely different geohash prefixes if they are on opposite sides of a grid boundary",
        explanation: "Consider two points 10 meters apart but on opposite sides of a geohash grid boundary — their geohash strings may share no common prefix. The solution: when querying for nearby drivers, always search the target cell AND all 8 neighboring cells. Uber's H3 hexagonal system mitigates this because hexagons have uniform neighbor distances.",
      },
      {
        question: "What is surge pricing based on at a technical level?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "The time of day only",
          "The supply-demand ratio in a geographic area: (ride requests / available drivers) determines the multiplier",
          "Random fluctuation to maximize profit",
          "The distance of the trip",
        ],
        correctAnswer: "The supply-demand ratio in a geographic area: (ride requests / available drivers) determines the multiplier",
        explanation: "Surge pricing is calculated per geographic zone (H3 cell). The system computes: demand (ride requests in last N minutes) / supply (available drivers in the zone). When demand/supply > threshold (e.g., 1.5), surge activates with a multiplier. This is recalculated every 1-2 minutes. The economic goal is to incentivize more drivers to the area and reduce demand to reach equilibrium.",
      },
      {
        question: "Why doesn't Uber simply match riders with the closest available driver?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "The closest driver may be moving away from the rider",
          "Multiple factors matter: ETA (not just distance), driver rating, vehicle type, and global optimization across all pending requests",
          "Uber randomizes matching for fairness",
          "Closer drivers cost more",
        ],
        correctAnswer: "Multiple factors matter: ETA (not just distance), driver rating, vehicle type, and global optimization across all pending requests",
        explanation: "The closest driver by straight-line distance might be across a river with a 15-minute bridge detour, while a slightly farther driver has a 3-minute ETA on a direct road. Uber's matching considers: (1) ETA (road-network distance, not Euclidean), (2) driver rating, (3) vehicle type match, (4) driver heading direction, (5) global optimization — sometimes assigning a slightly farther driver to one rider frees up a closer driver for another rider, reducing total wait time across the system.",
      },
      {
        question: "How does Uber handle the case where a rider requests a ride but no drivers are available?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "Immediately return an error",
          "Expand the search radius progressively, apply surge pricing to attract drivers, and keep the request pending with periodic retry",
          "Redirect the rider to a competitor",
          "Create a virtual driver to accept the request",
        ],
        correctAnswer: "Expand the search radius progressively, apply surge pricing to attract drivers, and keep the request pending with periodic retry",
        explanation: "When no drivers are in the immediate area: (1) Expand search radius (e.g., from 2km to 5km to 10km), (2) Activate or increase surge pricing to incentivize nearby drivers, (3) Keep the request pending with a timeout (e.g., 60 seconds), (4) Notify the rider of estimated wait time, (5) If timeout expires, offer to notify the rider when a driver becomes available.",
      },
      {
        question: "What algorithm does Uber use for ETA calculation?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Simple Euclidean distance / average speed",
          "Modified Dijkstra's algorithm on a road graph weighted by real-time traffic conditions and historical travel times",
          "Machine learning only, no graph algorithms",
          "GPS device built-in navigation",
        ],
        correctAnswer: "Modified Dijkstra's algorithm on a road graph weighted by real-time traffic conditions and historical travel times",
        explanation: "Uber models the road network as a weighted graph. Edge weights combine: (1) road segment distance, (2) real-time traffic speed (from driver GPS data), (3) historical average speed for that time/day. A modified Dijkstra's (or A* for efficiency) finds the shortest-time path. Pre-computation (contraction hierarchies) handles common routes. The system re-routes dynamically as traffic changes.",
      },
      {
        question: "Design the data model for a real-time driver location store. What data structure and database would you use?",
        format: "open",
        difficulty: 4,
        bloomLabel: "Create",
        explanation: "**Strong answer:** Use Redis with GEOADD/GEOSEARCH commands. Key: 'drivers:active:{city_id}', Value: GEOADD with longitude, latitude, driver_id. For queries: GEOSEARCH 'drivers:active:nyc' FROMLONLAT -73.9857 40.7484 BYRADIUS 5 km. Additional data per driver stored in a hash: 'driver:{id}' -> {status, vehicle_type, rating, heading, speed, last_update_ts}. TTL of 30 seconds on each driver entry — if no update received, driver is considered offline. Partition by city to keep each Redis instance manageable. Use Redis Cluster for high availability.",
      },
      {
        question: "Explain how batched matching improves overall system efficiency compared to greedy matching.",
        format: "open",
        difficulty: 5,
        bloomLabel: "Evaluate",
        explanation: "**Greedy matching** assigns each ride request to the best available driver immediately. Problem: Driver A is 3 min from Rider 1 and 2 min from Rider 2. Driver B is 5 min from Rider 1 and 10 min from Rider 2. Greedy assigns A->1 (best for Rider 1), then B->2 (10 min wait). **Batched matching** collects requests over a short window (2-3 seconds), then solves an optimization problem (Hungarian algorithm or similar) to minimize total wait time. Optimal: A->2 (2 min), B->1 (5 min). Total: 7 min vs greedy's 13 min. Trade-off: batching adds 2-3 seconds of latency to each request, but reduces average wait time across the system. Uber uses a variant called 'batched graph matching' in their OORT dispatch system.",
      },
    ],
    cheatSheet: `# Design Uber - Cheat Sheet

## Scale Numbers
| Metric | Value |
|--------|-------|
| Daily rides | 20M+ |
| Cities | 10,000+ |
| Concurrent drivers | ~5M |
| Location updates/sec | ~1.25M |
| Match latency target | < 10 seconds |
| ETA accuracy target | < 2 min error |

## Core Components
- **Location Service** - real-time driver GPS (Redis + WebSocket)
- **Matching Service** - rider-driver dispatch (batched optimization)
- **Trip Service** - ride lifecycle state machine
- **Pricing Service** - fare calculation + surge pricing
- **ETA Service** - road graph + traffic (Dijkstra/A*)
- **Payment Service** - fare charging (idempotent)
- **Notification Service** - push notifications + SMS
- **Map Service** - road network, geocoding, routing

## Technology Choices (Real)
| Component | Technology |
|-----------|-----------|
| Location Store | Redis (GEOADD/GEOSEARCH) |
| Spatial Index | H3 (hexagonal cells) |
| Trip DB | PostgreSQL (sharded by city) |
| Message Queue | Kafka (event streaming) |
| Real-time Comms | WebSocket (driver location) |
| ETA Engine | Custom graph engine (Dijkstra + ML) |
| Analytics | Apache Spark + Hive |

## Ride Lifecycle
\`\`\`
REQUESTED -> MATCHED -> DRIVER_EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED -> PAID
                |                                          |
                v                                          v
            CANCELLED_BY_RIDER                     CANCELLED_BY_DRIVER
\`\`\`

## Key API Endpoints
\`\`\`
POST   /api/v1/rides              -> request a ride
GET    /api/v1/rides/{id}         -> ride status
PUT    /api/v1/rides/{id}/cancel  -> cancel ride
WS     /ws/driver/location        -> stream driver location
POST   /api/v1/rides/{id}/rate    -> rate driver/rider
GET    /api/v1/pricing/estimate   -> fare estimate + surge
\`\`\`

## Geospatial Indexing
- **Geohash**: base32 string, 1 char = ~5000km, 6 chars = ~1.2km
- **H3**: hexagonal cells, resolution 7 = ~5km^2, resolution 9 = ~0.1km^2
- **Boundary fix**: always query target cell + all neighbors

## Interview Tips
1. Start with the ride lifecycle state machine
2. Focus on geospatial indexing (H3/geohash)
3. Matching algorithm is THE key deep-dive
4. Mention: WebSocket for real-time, Redis for locations
5. Discuss surge pricing as supply-demand economics
`,
    ladder: buildLadder("Uber"),
    resources: buildResources("Uber", [
      {
        title: "Uber Engineering Blog",
        author: "Uber",
        category: "blogs",
        justification: "Uber publishes detailed engineering articles about their distributed systems, real-time architecture, and ML systems.",
        bestFor: "Deep technical understanding of ride-sharing platform engineering",
        estimatedTime: "8 hours",
        cost: "Free",
        confidence: "HIGH",
        url: "https://www.uber.com/en-US/blog/engineering/",
      },
    ]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STUDY 4: DESIGN AIRBNB
// ════════════════════════════════════════════════════════════════════════════

function buildAirbnb() {
  return {
    topic: "Design: Airbnb (Detailed)",
    category: "System Design Cases",
    plan: {
      overview:
        "A deep-dive case study on designing Airbnb — a global accommodation booking platform with 7M+ active listings across 100K+ cities. Covers search with geospatial + availability filtering, booking system with double-booking prevention, pricing algorithms, and trust/safety systems.",
      skippedTopics: "Airbnb Experiences, long-term stays, host insurance, Airbnb Plus verification",
      sessions: [
        {
          sessionNumber: 1,
          title: "Requirements & Back-of-Envelope Estimation",
          paretoJustification: "Airbnb is a two-sided marketplace — requirements must cover both hosts and guests, and estimation reveals the search-heavy, booking-light traffic pattern.",
          objectives: [
            "Define requirements for hosts (listing, calendar, pricing) and guests (search, book, review)",
            "Calculate search QPS, booking QPS, storage for listings and images",
            "Identify search as the critical high-QPS, low-latency operation",
          ],
          activities: [
            { description: "List host requirements: create listing, manage calendar, set pricing, respond to guests", durationMinutes: 10 },
            { description: "List guest requirements: search, filter, book, review, message host", durationMinutes: 10 },
            { description: "Estimate: 150M users, ~2M bookings/day, ~100M searches/day", durationMinutes: 15 },
            { description: "Storage: 7M listings * 20 photos * 500KB = ~70TB of images", durationMinutes: 10 },
          ],
          resources: [
            { title: "Airbnb Engineering Blog", type: "blog" },
            { title: "Designing Data-Intensive Applications Ch.3", type: "book" },
          ],
          reviewQuestions: [
            "What is the ratio of searches to bookings on Airbnb?",
            "Why is search latency more critical than booking latency?",
            "How much image storage does Airbnb need for 7M listings?",
            "What makes Airbnb a two-sided marketplace and why does that matter architecturally?",
          ],
          successCriteria: "Can identify the search-heavy pattern and estimate QPS for both searches and bookings.",
        },
        {
          sessionNumber: 2,
          title: "High-Level Architecture",
          paretoJustification: "Airbnb's architecture must handle search (read-heavy, geo-aware), bookings (write-heavy, transactional), and messaging (real-time) — a diverse set of requirements.",
          objectives: [
            "Design the high-level architecture with search, booking, and messaging paths",
            "Understand the booking flow: search -> select -> book -> confirm -> stay -> review",
            "Identify key services and their scaling characteristics",
          ],
          activities: [
            { description: "Draw architecture: Mobile/Web -> CDN -> API Gateway -> Service Mesh -> Storage", durationMinutes: 15 },
            { description: "Design search flow: query -> Elasticsearch -> availability check -> ranking -> results", durationMinutes: 15 },
            { description: "Design booking flow: select -> reserve (hold) -> payment -> confirm", durationMinutes: 15 },
            { description: "Identify services: Search, Listing, Booking, Payment, Review, Messaging, Pricing", durationMinutes: 10 },
          ],
          resources: [
            { title: "Airbnb's Service-Oriented Architecture", type: "blog" },
            { title: "Microservices at Airbnb", type: "blog" },
          ],
          reviewQuestions: [
            "What are the key differences between the search path and the booking path?",
            "Why is the booking flow transactional while search can be eventually consistent?",
            "How does the messaging service integrate with the booking lifecycle?",
            "What is a service mesh and why would Airbnb use one?",
          ],
          successCriteria: "Can draw a complete architecture and trace both search and booking flows.",
        },
        {
          sessionNumber: 3,
          title: "Database Design & Availability Calendar",
          paretoJustification: "The availability calendar is Airbnb's most complex data problem — it must be accurate in real-time to prevent double bookings while supporting efficient date-range queries.",
          objectives: [
            "Design schemas for listings, bookings, availability, and reviews",
            "Implement the availability calendar with date-range queries",
            "Prevent double bookings with pessimistic or optimistic locking",
          ],
          activities: [
            { description: "Design SQL schema: listings, hosts, guests, bookings, reviews, availability", durationMinutes: 15 },
            { description: "Design availability calendar: per-listing date ranges with status (available/blocked/booked)", durationMinutes: 20 },
            { description: "Implement double-booking prevention with database-level locking", durationMinutes: 15 },
            { description: "Design indexing for date-range + location queries", durationMinutes: 10 },
          ],
          resources: [
            { title: "Airbnb's Booking System Architecture", type: "blog" },
            { title: "Handling Double Bookings at Scale", type: "blog" },
          ],
          reviewQuestions: [
            "How would you model the availability calendar in SQL?",
            "What is the difference between pessimistic and optimistic locking for booking?",
            "How do you efficiently query 'available listings for dates June 1-7 in Paris'?",
            "What isolation level would you use for the booking transaction?",
          ],
          successCriteria: "Can design the availability calendar and explain double-booking prevention.",
        },
        {
          sessionNumber: 4,
          title: "API Design",
          paretoJustification: "Airbnb's API must support complex search queries with geo-spatial, date-range, and preference filters — designing this efficiently is non-trivial.",
          objectives: [
            "Design search API with multiple filter dimensions",
            "Design booking API with reservation hold pattern",
            "Handle API versioning and backward compatibility",
          ],
          activities: [
            { description: "Design search API: GET /listings?lat=&lng=&radius=&check_in=&check_out=&guests=&price_min=&price_max=", durationMinutes: 15 },
            { description: "Design booking API with 2-phase: reserve (hold 15min) -> confirm (payment)", durationMinutes: 15 },
            { description: "Design listing management APIs for hosts", durationMinutes: 10 },
            { description: "Design review and messaging APIs", durationMinutes: 10 },
          ],
          resources: [
            { title: "Airbnb API Design Standards", type: "docs" },
            { title: "RESTful API Design Best Practices", type: "blog" },
          ],
          reviewQuestions: [
            "How would you design the search API to handle 10+ filter parameters efficiently?",
            "Why use a 2-phase booking (reserve then confirm) instead of direct booking?",
            "How long should a reservation hold last before expiring?",
            "How do you handle API versioning when search parameters change?",
          ],
          successCriteria: "Can design search and booking APIs with proper patterns for complex queries.",
        },
        {
          sessionNumber: 5,
          title: "Search & Ranking System",
          paretoJustification: "Search is Airbnb's most critical feature — combining geospatial queries, availability filtering, and ML-based ranking into a sub-second response is the core technical challenge.",
          objectives: [
            "Design the search pipeline: query -> geo filter -> availability filter -> rank -> paginate",
            "Understand Elasticsearch for listing search",
            "Implement ranking with quality score, relevance, and personalization",
          ],
          activities: [
            { description: "Design search pipeline stages and their latency budgets", durationMinutes: 15 },
            { description: "Implement Elasticsearch index for listings with geo_point and nested availability", durationMinutes: 15 },
            { description: "Design ranking: quality score (reviews, photos, response rate) + relevance + personalization", durationMinutes: 15 },
            { description: "Handle search result diversity (don't show all listings from one host)", durationMinutes: 10 },
          ],
          resources: [
            { title: "Airbnb's Search Architecture", type: "blog" },
            { title: "Elasticsearch at Airbnb", type: "blog" },
          ],
          reviewQuestions: [
            "What is the latency budget for each stage of the search pipeline?",
            "How does Elasticsearch handle geo-spatial queries efficiently?",
            "What signals does Airbnb use for listing ranking?",
            "How do you ensure search result diversity?",
          ],
          successCriteria: "Can design a complete search pipeline with geo + availability filtering and ML ranking.",
        },
        {
          sessionNumber: 6,
          title: "Caching & Performance",
          paretoJustification: "With 100M+ searches/day, aggressive caching is essential. Understanding what is cacheable (listing metadata) vs what is not (availability) is crucial.",
          objectives: [
            "Design caching strategy for search results, listings, and pricing",
            "Understand what can be cached (listing info) vs what cannot (real-time availability)",
            "Implement CDN caching for listing images",
          ],
          activities: [
            { description: "Design cache layers: CDN (images), Redis (listing metadata, search results), local (configuration)", durationMinutes: 15 },
            { description: "Implement search result caching with smart invalidation", durationMinutes: 15 },
            { description: "Design image CDN with responsive images (thumbnails, medium, full-size)", durationMinutes: 10 },
            { description: "Handle cache consistency for pricing and availability updates", durationMinutes: 15 },
          ],
          resources: [
            { title: "CDN Architecture for Image-Heavy Sites", type: "blog" },
            { title: "Caching Strategies at Scale", type: "blog" },
          ],
          reviewQuestions: [
            "Why can't you cache availability data for long periods?",
            "How would you cache search results when they depend on real-time availability?",
            "What image sizes should Airbnb serve and how does responsive images work?",
            "When a host changes their price, how quickly must the cache reflect this?",
          ],
          successCriteria: "Can design a caching strategy that correctly handles cacheable vs real-time data.",
        },
        {
          sessionNumber: 7,
          title: "Scalability & Global Architecture",
          paretoJustification: "Airbnb operates globally with highly regional traffic — understanding geo-partitioning and multi-region architecture is essential for handling this scale.",
          objectives: [
            "Design horizontal scaling for search and booking services",
            "Implement database sharding for listings and bookings",
            "Handle multi-region deployment for global availability",
          ],
          activities: [
            { description: "Design Elasticsearch cluster scaling: sharding by region, replicas for read throughput", durationMinutes: 15 },
            { description: "Implement database sharding: listings by region, bookings by listing_id", durationMinutes: 15 },
            { description: "Design multi-region deployment: US, EU, APAC with data locality", durationMinutes: 15 },
            { description: "Handle cross-region bookings (US guest booking EU listing)", durationMinutes: 10 },
          ],
          resources: [
            { title: "Scaling Airbnb Search", type: "blog" },
            { title: "Multi-Region Database Architecture", type: "blog" },
          ],
          reviewQuestions: [
            "How would you shard the Elasticsearch index for listings?",
            "Should booking data be sharded by guest or by listing?",
            "How do you handle a guest in the US booking a listing in Europe?",
            "What is data locality and why does it matter for Airbnb?",
          ],
          successCriteria: "Can design multi-region architecture with proper sharding strategies.",
        },
        {
          sessionNumber: 8,
          title: "Reliability, Trust & Safety",
          paretoJustification: "Airbnb handles money and physical safety — reliability of bookings, fraud detection, and trust systems are non-negotiable for a marketplace platform.",
          objectives: [
            "Design payment reliability with escrow pattern",
            "Implement fraud detection for fake listings and scam guests",
            "Design review system with anti-gaming measures",
          ],
          activities: [
            { description: "Design payment flow: guest pays -> escrow -> host paid after check-in + 24h", durationMinutes: 15 },
            { description: "Implement fraud detection: fake listing detection, identity verification", durationMinutes: 15 },
            { description: "Design review system: mutual blind reviews, anti-gaming (delayed reveal)", durationMinutes: 10 },
            { description: "Define SLOs and monitoring for booking reliability", durationMinutes: 15 },
          ],
          resources: [
            { title: "Trust and Safety at Airbnb", type: "blog" },
            { title: "Payment Processing Patterns", type: "blog" },
          ],
          reviewQuestions: [
            "Why does Airbnb use an escrow pattern for payments?",
            "How do mutual blind reviews prevent review manipulation?",
            "What signals would you use to detect a fake listing?",
            "What is the SLO for booking confirmation success rate?",
          ],
          successCriteria: "Can design payment escrow, fraud detection, and review reliability systems.",
        },
      ],
    },
    quizBank: [
      {
        question: "How does Airbnb prevent double bookings for the same listing and dates?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Eventual consistency — last write wins",
          "Pessimistic locking: SELECT FOR UPDATE on the availability rows during the booking transaction",
          "Optimistic locking with no retries",
          "A global lock on all listings",
        ],
        correctAnswer: "Pessimistic locking: SELECT FOR UPDATE on the availability rows during the booking transaction",
        explanation: "To prevent double bookings, Airbnb uses pessimistic locking. When a guest initiates a booking, the system acquires a row-level lock (SELECT FOR UPDATE) on the availability records for those dates. If another booking attempt arrives for the same dates, it blocks until the first transaction completes. This ensures only one booking can succeed. Optimistic locking (version check) is an alternative but requires retry logic.",
      },
      {
        question: "What type of search index does Airbnb primarily use for listing discovery?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Remember",
        options: ["MySQL full-text search", "Elasticsearch with geo_point fields", "MongoDB Atlas Search", "Redis Search"],
        correctAnswer: "Elasticsearch with geo_point fields",
        explanation: "Airbnb uses Elasticsearch for its search infrastructure. Elasticsearch supports geo_point fields for geospatial queries (find listings within a bounding box or radius), nested objects for availability, and full-text search for listing descriptions. Its distributed architecture handles Airbnb's 100M+ daily searches.",
      },
      {
        question: "Why does Airbnb use a 2-phase booking process (reserve then confirm)?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "To save server resources",
          "The reservation hold prevents the listing from being double-booked while the guest completes payment, avoiding lost bookings due to payment delays",
          "To comply with hotel industry regulations",
          "To give hosts time to review the guest",
        ],
        correctAnswer: "The reservation hold prevents the listing from being double-booked while the guest completes payment, avoiding lost bookings due to payment delays",
        explanation: "The 2-phase process solves a key problem: payment processing takes 5-30 seconds and can fail. Without a hold, two guests could simultaneously try to book the same dates — both see it as available, but only one payment succeeds. The reservation hold (typically 10-15 minutes) temporarily blocks those dates, giving the guest time to complete payment without risk of losing the booking.",
      },
      {
        question: "What is the escrow payment pattern and why does Airbnb use it?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "Instant payment to the host upon booking",
          "Guest's payment is held by Airbnb and released to the host 24 hours after check-in, protecting both parties",
          "Payment is split equally between Airbnb and the host",
          "The guest pays after the stay is complete",
        ],
        correctAnswer: "Guest's payment is held by Airbnb and released to the host 24 hours after check-in, protecting both parties",
        explanation: "In the escrow pattern, Airbnb charges the guest at booking time but holds the funds. The host receives payment 24 hours after the guest checks in. This protects guests (refund if listing is misrepresented) and hosts (guaranteed payment for legitimate stays). It also gives Airbnb time to handle disputes.",
      },
      {
        question: "How would you efficiently query 'available listings in Paris for June 1-7, 2+ bedrooms, under $150/night'?",
        format: "open",
        difficulty: 4,
        bloomLabel: "Apply",
        explanation: "**Pipeline approach:** (1) Elasticsearch geo-query: filter listings within Paris bounding box using geo_bounding_box. (2) Attribute filter: bedrooms >= 2 AND price <= 150 (Elasticsearch term/range queries). (3) Availability check: either pre-indexed in ES (availability as nested date ranges) or post-filter against availability service. (4) Rank by quality score. The availability check is the hard part — options: (a) Denormalize availability into Elasticsearch (fast but complex to keep in sync), (b) Two-phase: ES returns candidate listings, then batch-check availability against the booking database. Option (b) is simpler but adds latency. Airbnb uses a hybrid: popular date ranges are pre-indexed, long-tail queries do the two-phase check.",
      },
      {
        question: "What signals does Airbnb use to rank search results?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Only the listing price (cheapest first)",
          "Quality score (reviews, photos, response rate), relevance (location match, amenity match), personalization (user's past booking patterns), and conversion probability",
          "Random ordering to give all hosts equal visibility",
          "Only the number of reviews",
        ],
        correctAnswer: "Quality score (reviews, photos, response rate), relevance (location match, amenity match), personalization (user's past booking patterns), and conversion probability",
        explanation: "Airbnb's ranking model combines multiple signals: (1) Quality: average review score, number of reviews, professional photos, host response rate, Superhost status. (2) Relevance: how well the listing matches the query (location, dates, guest count, amenities). (3) Personalization: user's past booking history, price sensitivity, preferred neighborhoods. (4) Conversion probability: ML model predicting likelihood of booking. This is a learning-to-rank model trained on historical booking data.",
      },
      {
        question: "Approximately how many active listings does Airbnb have worldwide?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Remember",
        options: ["500,000", "2 million", "7 million+", "50 million"],
        correctAnswer: "7 million+",
        explanation: "Airbnb has over 7 million active listings across 100,000+ cities in 220+ countries. This scale means the search index is large but manageable (compared to billions of web pages). The main challenge is not index size but query complexity — each search combines geo-spatial, temporal (availability), and attribute filters.",
      },
      {
        question: "Why are mutual blind reviews important for Airbnb's trust system?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "They are faster to write",
          "Neither party can see the other's review until both have submitted (or the window expires), preventing retaliatory reviews",
          "They save storage space",
          "They are required by law in some countries",
        ],
        correctAnswer: "Neither party can see the other's review until both have submitted (or the window expires), preventing retaliatory reviews",
        explanation: "In mutual blind reviews, the guest's review of the host and the host's review of the guest are both hidden until both are submitted (or a 14-day window expires). This prevents retaliatory reviews — a host won't give a guest a bad review just because the guest gave them a bad one, since they can't see it yet. This leads to more honest reviews and stronger trust in the platform.",
      },
      {
        question: "How would you design the availability calendar to efficiently answer 'is this listing available from date X to date Y?'",
        format: "open",
        difficulty: 4,
        bloomLabel: "Create",
        explanation: "**Two main approaches:** (1) **Date-per-row model:** Table: availability(listing_id, date, status). One row per date per listing. Query: SELECT COUNT(*) FROM availability WHERE listing_id=X AND date BETWEEN X AND Y AND status='blocked'. If count > 0, not available. Simple but creates many rows (7M listings * 365 days = 2.5B rows/year). (2) **Range model:** Table: bookings(listing_id, start_date, end_date). Query: SELECT 1 FROM bookings WHERE listing_id=X AND start_date < Y AND end_date > X. If any row returned, there is an overlap (not available). Fewer rows but range overlap queries need careful indexing. **Airbnb's approach:** Hybrid — use the range model for bookings and a separate blocked_dates table for host-blocked dates. Index on (listing_id, start_date, end_date). Cache hot listings' availability in Redis as a bitmap (1 bit per day for the next 365 days).",
      },
      {
        question: "What is the main challenge of sharding the listings database by geographic region?",
        format: "mcq",
        difficulty: 4,
        bloomLabel: "Analyze",
        options: [
          "Regions have unequal numbers of listings, creating hotspots (e.g., Paris has 65K+ listings while some regions have hundreds)",
          "Geographic regions do not change",
          "All queries are single-region",
          "There is no challenge — geographic sharding is always balanced",
        ],
        correctAnswer: "Regions have unequal numbers of listings, creating hotspots (e.g., Paris has 65K+ listings while some regions have hundreds)",
        explanation: "Geographic sharding creates unbalanced partitions. Paris alone has 65,000+ listings while entire countries may have only a few hundred. Solutions: (1) Use fine-grained geo-cells (not countries) as shard keys, (2) Split large cities across multiple shards, (3) Use consistent hashing with virtual nodes to rebalance. Also, cross-region search queries (e.g., 'listings in Southern France') may span multiple shards, requiring scatter-gather queries.",
      },
    ],
    cheatSheet: `# Design Airbnb - Cheat Sheet

## Scale Numbers
| Metric | Value |
|--------|-------|
| Active listings | 7M+ |
| Countries | 220+ |
| Cities | 100K+ |
| Searches/day | ~100M |
| Bookings/day | ~2M |
| Images stored | ~140M (7M * 20 avg) |

## Core Components
- **Search Service** - Elasticsearch + geo + availability
- **Listing Service** - CRUD for listings, calendar management
- **Booking Service** - reservation, payment, confirmation
- **Pricing Service** - dynamic pricing, smart pricing tool
- **Review Service** - mutual blind reviews
- **Messaging Service** - host-guest communication
- **Payment Service** - escrow, payouts, refunds
- **Trust Service** - identity verification, fraud detection

## Technology Choices
| Component | Technology |
|-----------|-----------|
| Search | Elasticsearch (geo_point + nested) |
| Listing DB | MySQL (sharded by region) |
| Booking DB | MySQL (SERIALIZABLE isolation) |
| Cache | Redis + Memcached |
| Image Storage | S3 + CloudFront CDN |
| Message Queue | Kafka |
| ML Ranking | TensorFlow Serving |

## Double-Booking Prevention
\`\`\`sql
BEGIN;
SELECT * FROM availability
WHERE listing_id = ? AND date BETWEEN ? AND ?
FOR UPDATE;
-- Check all dates are available
INSERT INTO bookings (listing_id, guest_id, check_in, check_out, status)
VALUES (?, ?, ?, ?, 'confirmed');
UPDATE availability SET status = 'booked'
WHERE listing_id = ? AND date BETWEEN ? AND ?;
COMMIT;
\`\`\`

## Search Pipeline
1. Geo filter (bounding box) -> ~10K candidates
2. Date availability filter -> ~2K candidates
3. Attribute filter (price, bedrooms, amenities) -> ~500
4. ML ranking (quality, relevance, personalization) -> top 20
5. Diversity injection -> final 20 results

## Interview Tips
1. Clarify: booking marketplace vs hotel chain (two-sided)
2. Emphasize search pipeline complexity (geo + dates + attrs)
3. Double-booking prevention is THE key transaction discussion
4. Mention: escrow payments, blind reviews, fraud detection
5. Deep dive: search ranking or availability calendar
`,
    ladder: buildLadder("Airbnb"),
    resources: buildResources("Airbnb", [
      {
        title: "Airbnb Engineering & Data Science",
        author: "Airbnb",
        category: "blogs",
        justification: "Airbnb's engineering blog covers search architecture, ML ranking, and infrastructure at scale.",
        bestFor: "Understanding marketplace search and booking systems",
        estimatedTime: "6 hours",
        cost: "Free",
        confidence: "HIGH",
        url: "https://medium.com/airbnb-engineering",
      },
    ]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STUDY 5: DESIGN WHATSAPP
// ════════════════════════════════════════════════════════════════════════════

function buildWhatsApp() {
  return {
    topic: "Design: WhatsApp (Detailed)",
    category: "System Design Cases",
    plan: {
      overview:
        "A comprehensive case study on designing WhatsApp — the world's most popular messaging platform with 2B+ users sending 100B+ messages daily. Covers real-time messaging with WebSocket, end-to-end encryption, message delivery guarantees, group messaging, and the famously efficient Erlang backend.",
      skippedTopics: "WhatsApp Business API, WhatsApp Pay, Status/Stories, voice/video calls",
      sessions: [
        {
          sessionNumber: 1,
          title: "Requirements & Back-of-Envelope Estimation",
          paretoJustification: "WhatsApp's scale is staggering — 100B messages/day with real-time delivery. Understanding these numbers reveals why efficiency per server is critical.",
          objectives: [
            "Define functional requirements: 1:1 chat, group chat, media sharing, read receipts, online status",
            "Calculate message QPS, connection count, storage requirements",
            "Understand WhatsApp's legendary efficiency: 2B users on ~1000 servers (Erlang)",
          ],
          activities: [
            { description: "List functional requirements for sender and receiver", durationMinutes: 10 },
            { description: "Estimate: 2B users, 100B messages/day = ~1.15M messages/sec", durationMinutes: 15 },
            { description: "Calculate connection count: 500M concurrent connections", durationMinutes: 10 },
            { description: "Storage: 100B messages * 100 bytes avg = ~10TB/day for messages alone", durationMinutes: 10 },
          ],
          resources: [
            { title: "WhatsApp Architecture at Facebook Scale", type: "blog" },
            { title: "System Design Interview - Alex Xu Ch.12", type: "book" },
          ],
          reviewQuestions: [
            "How many messages does WhatsApp handle per second on average?",
            "Why can WhatsApp handle 2B users with relatively few servers?",
            "What is the storage growth rate for 100B messages/day?",
            "Why is message delivery latency (< 200ms) a hard requirement?",
          ],
          successCriteria: "Can calculate message QPS and explain why Erlang/BEAM enables WhatsApp's efficiency.",
        },
        {
          sessionNumber: 2,
          title: "High-Level Architecture",
          paretoJustification: "WhatsApp's architecture is deceptively simple at a high level — the complexity lies in the connection management and message routing layers.",
          objectives: [
            "Design the high-level architecture: clients, gateway, chat servers, storage",
            "Understand the role of WebSocket/MQTT for persistent connections",
            "Design the message routing layer",
          ],
          activities: [
            { description: "Draw architecture: Client -> Gateway -> Chat Server -> Message Store / Queue", durationMinutes: 15 },
            { description: "Design connection management: clients maintain WebSocket to their assigned chat server", durationMinutes: 15 },
            { description: "Design message routing: how does Server A know user B is on Server C?", durationMinutes: 15 },
            { description: "Design the offline message queue for users who are not connected", durationMinutes: 10 },
          ],
          resources: [
            { title: "XMPP and Modern Messaging Protocols", type: "docs" },
            { title: "Erlang at WhatsApp", type: "blog" },
          ],
          reviewQuestions: [
            "Why does WhatsApp use persistent connections instead of HTTP polling?",
            "How does the system route a message from User A on Server 1 to User B on Server 5?",
            "What happens to messages when the recipient is offline?",
            "What protocol does WhatsApp use under the hood (hint: modified XMPP)?",
          ],
          successCriteria: "Can design the connection layer and explain message routing between chat servers.",
        },
        {
          sessionNumber: 3,
          title: "Database Design & Message Storage",
          paretoJustification: "Storing 100B+ messages/day with fast retrieval requires careful storage design. The choice between storing messages per-user vs per-conversation defines the data model.",
          objectives: [
            "Design the message storage schema",
            "Choose between per-user and per-conversation message storage",
            "Understand WhatsApp's use of Mnesia (Erlang DB) and later migration to custom storage",
          ],
          activities: [
            { description: "Design schema: users, conversations, messages, message_status", durationMinutes: 15 },
            { description: "Compare per-user inbox vs per-conversation storage models", durationMinutes: 15 },
            { description: "Design message status tracking: sent, delivered, read (blue ticks)", durationMinutes: 10 },
            { description: "Plan storage: keep messages on server only until delivered (for E2EE), media in blob storage", durationMinutes: 15 },
          ],
          resources: [
            { title: "Cassandra for Messaging at Facebook", type: "blog" },
            { title: "Message Storage Design Patterns", type: "blog" },
          ],
          reviewQuestions: [
            "Should messages be stored per-user (inbox) or per-conversation? What are the trade-offs?",
            "How does end-to-end encryption affect server-side message storage?",
            "How do you implement the 'double blue tick' (read receipt) feature?",
            "Why might WhatsApp delete messages from the server after delivery?",
          ],
          successCriteria: "Can design message storage with delivery tracking and explain E2EE implications.",
        },
        {
          sessionNumber: 4,
          title: "API Design & Protocol",
          paretoJustification: "Unlike HTTP-based services, WhatsApp uses a custom binary protocol over WebSocket — understanding this protocol design shows deep systems thinking.",
          objectives: [
            "Design the messaging protocol over WebSocket",
            "Implement message acknowledgment and retry logic",
            "Design APIs for group management and media sharing",
          ],
          activities: [
            { description: "Design message protocol: message_id, sender, recipient, type, payload, timestamp", durationMinutes: 15 },
            { description: "Implement ACK flow: sent -> server_ack -> delivered -> read", durationMinutes: 15 },
            { description: "Design group management: create, add/remove members, admin controls", durationMinutes: 10 },
            { description: "Design media sharing: upload to blob store, send URL in message", durationMinutes: 15 },
          ],
          resources: [
            { title: "Signal Protocol Documentation", type: "docs" },
            { title: "Binary Protocol Design", type: "blog" },
          ],
          reviewQuestions: [
            "Why does WhatsApp use a binary protocol instead of JSON over WebSocket?",
            "How does the ACK flow ensure reliable message delivery?",
            "How are media files shared — inline or by reference?",
            "What happens if an ACK is lost? How do you prevent duplicate messages?",
          ],
          successCriteria: "Can design a messaging protocol with reliable delivery and acknowledgment.",
        },
        {
          sessionNumber: 5,
          title: "End-to-End Encryption & Security",
          paretoJustification: "End-to-end encryption is WhatsApp's defining feature. Understanding the Signal Protocol and key exchange shows security awareness that impresses interviewers.",
          objectives: [
            "Understand the Signal Protocol (Double Ratchet) for E2E encryption",
            "Design key exchange and key management",
            "Handle group encryption and multi-device support",
          ],
          activities: [
            { description: "Understand Diffie-Hellman key exchange and why it enables E2EE", durationMinutes: 15 },
            { description: "Design key management: identity keys, pre-keys, session keys", durationMinutes: 15 },
            { description: "Implement group E2EE: sender keys distributed to all group members", durationMinutes: 15 },
            { description: "Handle multi-device: each device has its own key pair", durationMinutes: 10 },
          ],
          resources: [
            { title: "Signal Protocol Technical Documentation", type: "docs" },
            { title: "WhatsApp Encryption Whitepaper", type: "docs" },
          ],
          reviewQuestions: [
            "How does the Double Ratchet algorithm provide forward secrecy?",
            "What happens if a user reinstalls WhatsApp — are old messages recoverable?",
            "How does group E2EE work when there are 256 members?",
            "Why can't WhatsApp read your messages even though they route them?",
          ],
          successCriteria: "Can explain E2EE at a high level and describe the key exchange process.",
        },
        {
          sessionNumber: 6,
          title: "Caching & Presence System",
          paretoJustification: "The 'online' status and 'last seen' features seem simple but at 2B users, the presence system generates enormous traffic. Caching and smart updates are essential.",
          objectives: [
            "Design the presence (online/offline/last seen) system",
            "Implement caching for user profiles and group metadata",
            "Handle the fan-out problem of presence updates in large groups",
          ],
          activities: [
            { description: "Design presence system: heartbeat-based online detection with configurable intervals", durationMinutes: 15 },
            { description: "Implement 'last seen' with lazy updates (update on disconnect, not continuously)", durationMinutes: 10 },
            { description: "Cache user profiles and group metadata in Redis", durationMinutes: 10 },
            { description: "Design presence fan-out: only notify users who have the chat open", durationMinutes: 15 },
          ],
          resources: [
            { title: "Presence at Scale - Facebook Engineering", type: "blog" },
            { title: "Real-time Presence Systems", type: "blog" },
          ],
          reviewQuestions: [
            "How do you determine if a user is online without excessive server load?",
            "Why should presence updates only be sent to users with the chat open?",
            "What is the heartbeat interval trade-off (frequency vs battery/bandwidth)?",
            "How would you cache group metadata for a group with 256 members?",
          ],
          successCriteria: "Can design an efficient presence system with smart fan-out.",
        },
        {
          sessionNumber: 7,
          title: "Scalability & Connection Management",
          paretoJustification: "Managing 500M+ concurrent WebSocket connections is one of the hardest scaling challenges in distributed systems. Understanding how WhatsApp achieves this with Erlang is eye-opening.",
          objectives: [
            "Design connection management for millions of concurrent connections per server",
            "Understand why Erlang/BEAM VM excels at massive concurrency",
            "Implement connection routing and server discovery",
          ],
          activities: [
            { description: "Design connection assignment: how to assign users to chat servers", durationMinutes: 15 },
            { description: "Understand Erlang's lightweight processes: 2M connections per server on 2 CPUs (2012)", durationMinutes: 10 },
            { description: "Design connection routing: user -> consistent hashing -> chat server", durationMinutes: 15 },
            { description: "Handle server failures: reconnect, message replay from queue", durationMinutes: 15 },
          ],
          resources: [
            { title: "1 Million Connections on a Single Server - WhatsApp", type: "blog" },
            { title: "Erlang/OTP for Messaging", type: "docs" },
          ],
          reviewQuestions: [
            "How does Erlang handle 2M+ concurrent connections on a single server?",
            "What happens when a chat server goes down — how do connected users recover?",
            "How does the system know which server a user is connected to?",
            "Why is consistent hashing used for connection assignment?",
          ],
          successCriteria: "Can explain Erlang's concurrency model and design connection routing with failover.",
        },
        {
          sessionNumber: 8,
          title: "Reliability & Message Delivery Guarantees",
          paretoJustification: "Users expect every message to be delivered — exactly once, in order. Providing this guarantee in a distributed system at WhatsApp's scale is a fundamental distributed systems challenge.",
          objectives: [
            "Design at-least-once delivery with client-side deduplication for exactly-once semantics",
            "Implement message ordering within a conversation",
            "Handle network partitions, server crashes, and split-brain scenarios",
          ],
          activities: [
            { description: "Design delivery guarantee: server ACK + client dedup by message_id", durationMinutes: 15 },
            { description: "Implement message ordering: sequence numbers per conversation", durationMinutes: 15 },
            { description: "Design offline message sync: client sends last_message_id, server sends everything after", durationMinutes: 10 },
            { description: "Handle edge cases: out-of-order delivery, duplicate delivery, lost ACKs", durationMinutes: 15 },
          ],
          resources: [
            { title: "Exactly-Once Semantics in Messaging", type: "blog" },
            { title: "Distributed Systems - Reliable Delivery", type: "book" },
          ],
          reviewQuestions: [
            "Is WhatsApp at-least-once or exactly-once delivery? How?",
            "How do you maintain message ordering in a conversation?",
            "What happens if a message ACK is lost — does the sender retransmit?",
            "How does offline sync work when a user reconnects after hours?",
          ],
          successCriteria: "Can design reliable message delivery with ordering and deduplication.",
        },
      ],
    },
    quizBank: [
      {
        question: "Approximately how many messages does WhatsApp handle per day?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Remember",
        options: ["1 billion", "10 billion", "100 billion+", "1 trillion"],
        correctAnswer: "100 billion+",
        explanation: "WhatsApp processes over 100 billion messages per day across 2 billion users. This translates to approximately 1.15 million messages per second on average, with peak rates significantly higher.",
      },
      {
        question: "What programming language/platform powers WhatsApp's backend?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Remember",
        options: ["Java on JVM", "Go", "Erlang on BEAM VM", "C++ with custom runtime"],
        correctAnswer: "Erlang on BEAM VM",
        explanation: "WhatsApp is built on Erlang/BEAM VM. Erlang's lightweight processes (not OS threads) enable handling millions of concurrent connections per server. In 2012, WhatsApp famously handled 2 million connections on a single server with 2 CPUs. The BEAM VM's preemptive scheduling and fault tolerance (let-it-crash philosophy) make it ideal for messaging.",
      },
      {
        question: "What encryption protocol does WhatsApp use for end-to-end encryption?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Remember",
        options: ["AES-256 only", "RSA-2048", "Signal Protocol (Double Ratchet)", "TLS 1.3"],
        correctAnswer: "Signal Protocol (Double Ratchet)",
        explanation: "WhatsApp uses the Signal Protocol (developed by Open Whisper Systems) for end-to-end encryption. The Double Ratchet algorithm provides forward secrecy — if a key is compromised, past messages remain secure because each message uses a different key. This means even WhatsApp's servers cannot decrypt messages.",
      },
      {
        question: "In WhatsApp's message delivery flow, what do the grey and blue ticks represent?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Understand",
        options: [
          "Grey = sent to server, Blue = sent to recipient",
          "One grey tick = sent to server, Two grey ticks = delivered to recipient's device, Two blue ticks = read by recipient",
          "Grey = unencrypted, Blue = encrypted",
          "Grey = text message, Blue = media message",
        ],
        correctAnswer: "One grey tick = sent to server, Two grey ticks = delivered to recipient's device, Two blue ticks = read by recipient",
        explanation: "WhatsApp's tick system maps to the ACK flow: (1) One grey tick: message received by WhatsApp server (server ACK). (2) Two grey ticks: message delivered to recipient's device (delivery ACK). (3) Two blue ticks: recipient opened the chat and read the message (read ACK). This provides sender visibility into the delivery pipeline.",
      },
      {
        question: "Why can WhatsApp handle 2 million connections on a single server?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "They use expensive server hardware",
          "Erlang's lightweight processes use ~2KB each (vs 1MB per OS thread), enabling millions of concurrent processes",
          "They use HTTP/2 multiplexing",
          "Each server has 128 CPU cores",
        ],
        correctAnswer: "Erlang's lightweight processes use ~2KB each (vs 1MB per OS thread), enabling millions of concurrent processes",
        explanation: "Erlang creates lightweight 'processes' (not OS threads) that use approximately 2KB of memory each. A server with 64GB RAM can create millions of these processes. Each WebSocket connection is handled by one Erlang process. The BEAM VM schedules these processes preemptively across CPU cores with minimal context-switching overhead. Compare: a Java thread uses ~1MB stack, so the same server could only handle ~64K threads.",
      },
      {
        question: "How does WhatsApp handle messages for offline users?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "Messages are dropped and the sender is notified",
          "Messages are stored in a persistent queue on the server and delivered when the recipient reconnects",
          "Messages are sent to the recipient's email instead",
          "Messages are stored on the sender's device only",
        ],
        correctAnswer: "Messages are stored in a persistent queue on the server and delivered when the recipient reconnects",
        explanation: "When a recipient is offline, the server stores messages in a persistent queue (per-user). When the recipient reconnects, the server delivers all queued messages in order. The server stores messages encrypted (since E2EE means the server can't read them anyway). Messages are deleted from the server after delivery confirmation. If the recipient doesn't come online for 30 days, messages are purged.",
      },
      {
        question: "What is the key challenge of end-to-end encryption in group chats?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "Groups cannot be encrypted",
          "The sender must encrypt the message separately for each group member (N encryptions for N members), or use sender keys where the sender distributes a shared key to all members",
          "Only the group admin can read messages",
          "Group messages are encrypted with a single static key",
        ],
        correctAnswer: "The sender must encrypt the message separately for each group member (N encryptions for N members), or use sender keys where the sender distributes a shared key to all members",
        explanation: "WhatsApp uses the 'sender keys' approach for group E2EE. Each sender generates a sender key and distributes it (via individual E2EE channels) to all group members. Then the sender encrypts the message once with their sender key, and all members can decrypt. When a member leaves, the sender generates a new sender key and redistributes. This is O(1) encryption per message vs O(N) for individual encryption.",
      },
      {
        question: "How does WhatsApp maintain message ordering within a conversation?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Server timestamps only",
          "Sequence numbers per conversation: each message gets an incrementing sequence number, clients use this to order messages",
          "Messages are always in order because TCP guarantees ordering",
          "Client-side sorting by message content",
        ],
        correctAnswer: "Sequence numbers per conversation: each message gets an incrementing sequence number, clients use this to order messages",
        explanation: "Each conversation has a monotonically increasing sequence counter. When a message is sent, the server assigns the next sequence number. Clients use this to display messages in order. TCP guarantees in-order delivery per connection, but messages may arrive out of order if they're routed through different paths or if one is retransmitted. Server-assigned sequence numbers provide a canonical ordering.",
      },
      {
        question: "Design the message routing: User A on Server 1 sends a message to User B on Server 5. How does the system route it?",
        format: "open",
        difficulty: 4,
        bloomLabel: "Create",
        explanation: "**Routing approach:** (1) User A sends message to their connected Chat Server 1. (2) Server 1 looks up User B's connection in a distributed routing table (Redis cluster or ZooKeeper). The entry maps user_id -> chat_server_id. (3) Server 1 forwards the message to Chat Server 5 (direct server-to-server communication via internal RPC/message bus). (4) Server 5 delivers the message to User B's WebSocket connection. (5) Server 5 sends a delivery ACK back to Server 1, which forwards it to User A. **If User B is offline:** Server 1 writes the message to User B's persistent queue (Cassandra/custom store), keyed by user_id. When User B reconnects (to any server), that server checks the queue and delivers pending messages. **Routing table update:** When a user connects, their chat server writes user_id -> server_id to the routing table. On disconnect, the entry is removed.",
      },
      {
        question: "What is the difference between at-least-once and exactly-once delivery, and which does WhatsApp use?",
        format: "open",
        difficulty: 4,
        bloomLabel: "Evaluate",
        explanation: "**At-least-once:** Every message is guaranteed to be delivered, but may arrive more than once (duplicates possible). Achieved by: sender retransmits if no ACK received within timeout. **Exactly-once:** Every message is delivered exactly one time — no loss, no duplicates. True exactly-once is impossible in distributed systems (Two Generals' Problem). **WhatsApp's approach:** At-least-once delivery with client-side deduplication. (1) Each message has a unique message_id (UUID generated by sender). (2) Server retransmits if no delivery ACK received. (3) Client maintains a set of received message_ids and ignores duplicates. (4) This achieves effectively-exactly-once from the user's perspective. The client dedup set only needs to hold IDs for a short window since retransmissions happen within seconds.",
      },
    ],
    cheatSheet: `# Design WhatsApp - Cheat Sheet

## Scale Numbers
| Metric | Value |
|--------|-------|
| MAU | 2B+ |
| Messages/day | 100B+ |
| Messages/sec (avg) | ~1.15M |
| Concurrent connections | ~500M |
| Message size (avg) | ~100 bytes (text) |
| Media messages/day | ~7B (images, video, audio) |

## Core Components
- **Gateway** - SSL termination, connection routing
- **Chat Server** - WebSocket connection management (Erlang)
- **Routing Service** - user -> server mapping (Redis)
- **Message Queue** - offline message storage (Cassandra)
- **Media Service** - upload/download media (S3-like)
- **Presence Service** - online/offline/last seen
- **Group Service** - group management, sender keys
- **Push Notification** - APNs/FCM for offline users

## Technology Choices (Real)
| Component | Technology |
|-----------|-----------|
| Backend | Erlang/OTP on BEAM VM |
| Database | Mnesia -> custom Cassandra-like |
| Cache | ETS (Erlang Term Storage) |
| Protocol | Modified XMPP (binary) |
| Encryption | Signal Protocol (Double Ratchet) |
| Media Storage | Blob storage + CDN |
| Connection | WebSocket / MQTT |

## Message Flow
\`\`\`
Sender -> Chat Server A -> [Routing Table lookup]
         -> Chat Server B -> Recipient (if online)
         -> Message Queue (if offline)
         -> Push Notification (if offline)
\`\`\`

## ACK Flow (Tick System)
\`\`\`
1 grey tick:  message -> server ACK
2 grey ticks: server -> recipient device ACK
2 blue ticks: recipient opened chat (read ACK)
\`\`\`

## E2E Encryption (Signal Protocol)
- Key exchange: X3DH (Extended Triple Diffie-Hellman)
- Message encryption: Double Ratchet (new key per message)
- Group: Sender Keys (O(1) encryption per message)
- Forward secrecy: compromised key can't decrypt past messages

## Interview Tips
1. Start with the message delivery flow (the core feature)
2. Emphasize: WebSocket, message routing, offline queues
3. E2EE is a differentiator — know Signal Protocol basics
4. Erlang/BEAM is the 'why so efficient' answer
5. Deep dive: group messaging or delivery guarantees
`,
    ladder: buildLadder("WhatsApp"),
    resources: buildResources("WhatsApp", [
      {
        title: "The WhatsApp Architecture Facebook Bought For $19 Billion",
        author: "High Scalability",
        category: "blogs",
        justification: "Detailed analysis of WhatsApp's Erlang-based architecture and how they achieved extreme efficiency.",
        bestFor: "Understanding the engineering decisions behind WhatsApp's scale",
        estimatedTime: "2 hours",
        cost: "Free",
        confidence: "HIGH",
        url: "http://highscalability.com/blog/2014/2/26/the-whatsapp-architecture-facebook-bought-for-19-billion.html",
      },
    ]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STUDY 6: DESIGN TWITTER/X
// ════════════════════════════════════════════════════════════════════════════

function buildTwitter() {
  return {
    topic: "Design: Twitter/X (Detailed)",
    category: "System Design Cases",
    plan: {
      overview:
        "A comprehensive case study on designing Twitter/X — a microblogging social network with 400M+ MAU. Covers the famous fan-out problem (tweet delivery to followers), timeline generation, trending topics computation, and real-time search. Twitter's engineering challenges have been extensively documented, making this one of the best-understood large-scale systems.",
      skippedTopics: "Twitter Spaces (audio), DMs encryption, Community Notes, X Premium/verification",
      sessions: [
        {
          sessionNumber: 1,
          title: "Requirements & Back-of-Envelope Estimation",
          paretoJustification: "Twitter's numbers are well-known and frequently cited in interviews. Knowing them cold shows preparation and enables quick, accurate estimation.",
          objectives: [
            "Define requirements: tweet, follow, timeline, search, trending, notifications",
            "Calculate tweet QPS, timeline read QPS, and fan-out scale",
            "Understand the extreme read-heavy nature (100,000x more reads than writes)",
          ],
          activities: [
            { description: "List functional requirements and identify the core feature (timeline)", durationMinutes: 10 },
            { description: "Estimate: 400M MAU, ~200M DAU, 500M tweets/day, avg 300 followers/user", durationMinutes: 15 },
            { description: "Calculate: 500M tweets * 300 followers = 150B timeline deliveries/day", durationMinutes: 10 },
            { description: "Compare write QPS (~6K tweets/sec) vs read QPS (~600K timeline loads/sec)", durationMinutes: 10 },
          ],
          resources: [
            { title: "Twitter Engineering Blog", type: "blog" },
            { title: "System Design Interview - Alex Xu Ch.11", type: "book" },
          ],
          reviewQuestions: [
            "How many tweets are posted per day and what is the write QPS?",
            "If 200M users check their timeline 5 times/day, what is the timeline read QPS?",
            "Why is Twitter described as having a fan-out problem?",
            "What is the average tweet size including metadata?",
          ],
          successCriteria: "Can calculate tweet QPS, timeline QPS, and explain the fan-out challenge.",
        },
        {
          sessionNumber: 2,
          title: "High-Level Architecture",
          paretoJustification: "Twitter's architecture evolution (from monolith to microservices) is one of the most documented in tech. Understanding it gives you real-world context for architectural decisions.",
          objectives: [
            "Design the high-level architecture with write and read paths",
            "Understand Twitter's real services: SnowFlake IDs, Manhattan (KV store), Gizzard (sharding)",
            "Identify the fan-out service as the critical component",
          ],
          activities: [
            { description: "Draw architecture: Client -> CDN -> LB -> API -> Fan-out / Timeline / Search -> Storage", durationMinutes: 15 },
            { description: "Design write path: tweet -> fan-out service -> push to follower timelines", durationMinutes: 15 },
            { description: "Design read path: timeline request -> pre-computed timeline cache", durationMinutes: 10 },
            { description: "Map Twitter's real services to architecture components", durationMinutes: 15 },
          ],
          resources: [
            { title: "Twitter Architecture - InfoQ Presentation", type: "blog" },
            { title: "Manhattan: Twitter's Distributed Key-Value Store", type: "docs" },
          ],
          reviewQuestions: [
            "What is the role of the fan-out service in Twitter's architecture?",
            "Why does Twitter pre-compute timelines instead of computing them on the fly?",
            "What is Manhattan and why did Twitter build their own KV store?",
            "How does the architecture handle both the tweet write path and the timeline read path?",
          ],
          successCriteria: "Can draw a complete architecture with fan-out service and pre-computed timelines.",
        },
        {
          sessionNumber: 3,
          title: "Database Design & Storage",
          paretoJustification: "Twitter uses a fascinating mix of custom storage systems — understanding when to build custom vs use off-the-shelf is a valuable lesson in system design.",
          objectives: [
            "Design schemas for tweets, users, follows, and timelines",
            "Understand Twitter's storage systems: MySQL (Gizzard), Manhattan, Redis, HDFS",
            "Design the timeline cache structure",
          ],
          activities: [
            { description: "Design SQL schema: users, tweets, follows, likes, retweets", durationMinutes: 15 },
            { description: "Design timeline cache: Redis sorted set per user (score=timestamp, member=tweet_id)", durationMinutes: 15 },
            { description: "Design media storage: images/videos in blob storage with CDN", durationMinutes: 10 },
            { description: "Plan sharding: tweets by tweet_id, timelines by user_id", durationMinutes: 15 },
          ],
          resources: [
            { title: "Redis at Twitter", type: "blog" },
            { title: "Gizzard: Sharding Framework at Twitter", type: "docs" },
          ],
          reviewQuestions: [
            "Why does Twitter use Redis sorted sets for timeline caching?",
            "How is the follows table structured and indexed for fast lookups?",
            "What is the trade-off of storing tweets by tweet_id vs by user_id?",
            "How does Twitter generate globally unique tweet IDs (Snowflake)?",
          ],
          successCriteria: "Can design the storage layer with proper use of Redis for timelines and SQL for tweets.",
        },
        {
          sessionNumber: 4,
          title: "API Design",
          paretoJustification: "Twitter's API is one of the most-used APIs in the world. Understanding its design decisions provides reusable patterns for any social media API.",
          objectives: [
            "Design RESTful APIs for tweeting, timeline, search, and interactions",
            "Handle rate limiting (Twitter's API limits are well-documented)",
            "Design the streaming API for real-time tweet delivery",
          ],
          activities: [
            { description: "Design tweet CRUD APIs: POST /tweets, GET /tweets/{id}, DELETE /tweets/{id}", durationMinutes: 10 },
            { description: "Design timeline API: GET /timeline/home?cursor=xxx (home) and GET /users/{id}/tweets (user)", durationMinutes: 15 },
            { description: "Design search API: GET /search?q=xxx&type=recent|top", durationMinutes: 10 },
            { description: "Design rate limiting: 300 requests/15min for timeline, 900 for user lookup", durationMinutes: 10 },
          ],
          resources: [
            { title: "Twitter API v2 Documentation", type: "docs" },
            { title: "Twitter Streaming API", type: "docs" },
          ],
          reviewQuestions: [
            "How does Twitter's home timeline API differ from a user's tweet history API?",
            "Why does Twitter enforce strict rate limits on their API?",
            "How does the streaming API work for real-time tweet delivery?",
            "What cursor format would you use for timeline pagination?",
          ],
          successCriteria: "Can design the complete API surface with proper rate limiting and pagination.",
        },
        {
          sessionNumber: 5,
          title: "Fan-out & Timeline Generation",
          paretoJustification: "Twitter's fan-out problem is THE classic system design interview question. Their solution (hybrid fan-out) has been presented at multiple conferences.",
          objectives: [
            "Deeply understand fan-out-on-write vs fan-out-on-read",
            "Design Twitter's hybrid approach for timeline generation",
            "Handle the celebrity problem (accounts with 50M+ followers)",
          ],
          activities: [
            { description: "Analyze fan-out-on-write: 500M tweets/day * 300 avg followers = 150B deliveries/day", durationMinutes: 15 },
            { description: "Analyze fan-out-on-read: 1B timeline reads/day * N followed accounts to merge", durationMinutes: 10 },
            { description: "Design hybrid: push for accounts with < 5K followers, pull + merge for celebrities", durationMinutes: 20 },
            { description: "Implement timeline merge: sorted merge of pre-computed feed + celebrity tweets at read time", durationMinutes: 10 },
          ],
          resources: [
            { title: "Timelines at Scale - Twitter QCon Talk", type: "blog" },
            { title: "Fan-out Problem Explained", type: "blog" },
          ],
          reviewQuestions: [
            "Why can't Twitter use pure fan-out-on-write for all accounts?",
            "What is the latency of fan-out for a celebrity with 50M followers?",
            "How does the timeline merge work at read time?",
            "What threshold does Twitter use to decide between push and pull?",
          ],
          successCriteria: "Can design the complete hybrid fan-out system and explain the celebrity problem.",
        },
        {
          sessionNumber: 6,
          title: "Caching, Search & Trending Topics",
          paretoJustification: "Twitter's search and trending topics are real-time features that require inverted indexes and streaming computation — a unique combination not seen in most systems.",
          objectives: [
            "Design the tweet search system with real-time indexing",
            "Implement trending topics using streaming computation",
            "Design multi-layer caching for timelines and tweets",
          ],
          activities: [
            { description: "Design search: Earlybird (Lucene-based) inverted index with real-time updates", durationMinutes: 15 },
            { description: "Design trending: sliding window count of hashtags/topics using stream processing", durationMinutes: 15 },
            { description: "Design cache layers: Redis (timelines), Memcached (tweet objects), CDN (media)", durationMinutes: 15 },
            { description: "Handle cache invalidation for tweet deletes and account suspensions", durationMinutes: 10 },
          ],
          resources: [
            { title: "Earlybird: Twitter's Real-Time Search Engine", type: "blog" },
            { title: "Trending Topics at Twitter", type: "blog" },
          ],
          reviewQuestions: [
            "How does Twitter index tweets in real-time for search?",
            "What algorithm would you use to compute trending topics from a stream of tweets?",
            "What is the Count-Min Sketch data structure and how does it help with trending?",
            "How do you invalidate timeline caches when a tweet is deleted?",
          ],
          successCriteria: "Can design real-time search indexing and streaming trending topic computation.",
        },
        {
          sessionNumber: 7,
          title: "Scalability & Performance",
          paretoJustification: "Twitter has gone through multiple scaling crises (the Fail Whale era) — understanding their scaling journey provides real-world lessons in growing a system.",
          objectives: [
            "Design horizontal scaling for timeline and fan-out services",
            "Implement partitioning for tweet storage and timeline caches",
            "Handle traffic spikes (e.g., major world events)",
          ],
          activities: [
            { description: "Design fan-out service scaling: partition by user_id hash, N workers per partition", durationMinutes: 15 },
            { description: "Design timeline cache partitioning: consistent hashing across Redis cluster", durationMinutes: 15 },
            { description: "Handle thundering herd on viral tweets: early cache warming, request coalescing", durationMinutes: 15 },
            { description: "Design traffic spike handling: graceful degradation (show stale timeline)", durationMinutes: 10 },
          ],
          resources: [
            { title: "Scaling Twitter to 150M DAU", type: "blog" },
            { title: "The Fail Whale: Twitter's Scaling Journey", type: "blog" },
          ],
          reviewQuestions: [
            "How does Twitter partition the fan-out work across multiple servers?",
            "What happens during a major event (Super Bowl, election) that causes a tweet spike?",
            "How does Twitter handle a viral tweet that everyone is viewing simultaneously?",
            "What is graceful degradation and how does Twitter implement it?",
          ],
          successCriteria: "Can design scaling strategies and explain graceful degradation for traffic spikes.",
        },
        {
          sessionNumber: 8,
          title: "Reliability & Monitoring",
          paretoJustification: "Twitter's reliability challenges (the Fail Whale era) and their solutions are some of the most instructive case studies in system reliability.",
          objectives: [
            "Design failure handling for fan-out, timeline, and search services",
            "Implement monitoring for real-time tweet flow and delivery latency",
            "Plan for disaster recovery with multi-datacenter architecture",
          ],
          activities: [
            { description: "Design circuit breakers for fan-out service (degrade to on-read if fan-out is overloaded)", durationMinutes: 15 },
            { description: "Implement monitoring: tweet delivery latency (p50, p99), fan-out lag, search freshness", durationMinutes: 15 },
            { description: "Design multi-datacenter architecture with active-active", durationMinutes: 15 },
            { description: "Handle data consistency across datacenters", durationMinutes: 10 },
          ],
          resources: [
            { title: "Twitter's Failure Domains", type: "blog" },
            { title: "Multi-Datacenter at Twitter", type: "blog" },
          ],
          reviewQuestions: [
            "What is the Fail Whale and what caused it?",
            "How does Twitter degrade gracefully when the fan-out service is overloaded?",
            "What SLO would you set for tweet delivery latency?",
            "How does Twitter handle a datacenter failure?",
          ],
          successCriteria: "Can design reliability strategies and explain Twitter's historical scaling challenges.",
        },
      ],
    },
    quizBank: [
      {
        question: "How many tweets are posted on Twitter per day?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Remember",
        options: ["5 million", "50 million", "500 million", "5 billion"],
        correctAnswer: "500 million",
        explanation: "Twitter handles approximately 500 million tweets per day. This translates to about 5,800 tweets per second on average, but peak rates during major events can be 10-20x higher.",
      },
      {
        question: "What is Twitter's Snowflake?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Remember",
        options: [
          "Their CDN service",
          "A distributed unique ID generator that creates time-sorted 64-bit IDs without coordination",
          "Their database sharding system",
          "A caching layer",
        ],
        correctAnswer: "A distributed unique ID generator that creates time-sorted 64-bit IDs without coordination",
        explanation: "Twitter Snowflake generates 64-bit unique IDs: 41 bits for timestamp (millisecond precision), 10 bits for machine ID, 12 bits for sequence number. This produces ~4096 unique IDs per millisecond per machine, IDs are roughly time-sorted (great for timeline ordering), and no central coordinator is needed. It has become an industry standard pattern.",
      },
      {
        question: "Why did Twitter move from fan-out-on-write to a hybrid approach?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "Fan-out-on-write was too slow for normal users",
          "Celebrity accounts (e.g., @BarackObama with 130M+ followers) made pure fan-out-on-write unsustainable — writing to 130M timeline caches for one tweet",
          "Fan-out-on-write used too much network bandwidth",
          "Twitter wanted to reduce their Redis usage",
        ],
        correctAnswer: "Celebrity accounts (e.g., @BarackObama with 130M+ followers) made pure fan-out-on-write unsustainable — writing to 130M timeline caches for one tweet",
        explanation: "With pure fan-out-on-write, a tweet from an account with 130M followers requires writing to 130 million Redis timeline caches. This takes minutes and generates enormous I/O. The hybrid approach: accounts with < ~5K followers use fan-out-on-write (most accounts). Accounts with > 5K followers use fan-out-on-read — their tweets are merged into timelines at read time from a separate 'celebrity tweets' cache.",
      },
      {
        question: "What data structure does Twitter use for the timeline cache in Redis?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Remember",
        options: ["Hash map", "List", "Sorted Set (ZSET) with timestamp as score and tweet_id as member", "Set"],
        correctAnswer: "Sorted Set (ZSET) with timestamp as score and tweet_id as member",
        explanation: "Twitter uses Redis Sorted Sets (ZSET) for timeline caching. Each user has a ZSET where the score is the tweet timestamp and the member is the tweet_id. This allows: O(log N) insertion of new tweets, O(log N + M) range queries for timeline pagination (ZRANGEBYSCORE), automatic ordering by time, and efficient trimming of old tweets (ZREMRANGEBYRANK to keep only the latest ~800 tweets).",
      },
      {
        question: "What is Twitter's Earlybird search engine?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "A recommendation engine for suggested accounts",
          "A real-time search engine built on Lucene that indexes tweets within seconds of posting",
          "A spam detection system",
          "A trending topics calculator",
        ],
        correctAnswer: "A real-time search engine built on Lucene that indexes tweets within seconds of posting",
        explanation: "Earlybird is Twitter's real-time search engine, built on top of Apache Lucene. Unlike traditional search engines that batch-index, Earlybird indexes tweets within seconds of posting, enabling real-time search. It uses an inverted index partitioned by time (recent tweets in memory, older tweets on disk) to prioritize recency in search results.",
      },
      {
        question: "How would you compute trending topics from a stream of 6,000 tweets/second?",
        format: "mcq",
        difficulty: 4,
        bloomLabel: "Apply",
        options: [
          "Count all hashtags in a SQL database and sort",
          "Use a sliding window with Count-Min Sketch for approximate frequency counting, comparing current window to baseline to detect spikes",
          "Sample 1% of tweets and count manually",
          "Use a blockchain to track hashtag counts",
        ],
        correctAnswer: "Use a sliding window with Count-Min Sketch for approximate frequency counting, comparing current window to baseline to detect spikes",
        explanation: "Trending isn't about total count — it's about velocity (spike over baseline). Approach: (1) Stream processing (Kafka Streams/Flink) ingests all tweets. (2) Count-Min Sketch provides approximate frequency counts with bounded error using minimal memory. (3) Compare current 10-minute window counts against the 24-hour baseline. (4) Topics where current_rate / baseline_rate > threshold are 'trending'. (5) Apply geographic and personalization filters. This handles 6K tweets/sec with low latency and bounded memory.",
      },
      {
        question: "What was the 'Fail Whale' and what architectural problem caused it?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Remember",
        options: [
          "A DNS failure",
          "Twitter's error page shown when the service was overloaded — caused by a monolithic Ruby on Rails architecture that couldn't handle growing traffic",
          "A CDN outage",
          "A security breach",
        ],
        correctAnswer: "Twitter's error page shown when the service was overloaded — caused by a monolithic Ruby on Rails architecture that couldn't handle growing traffic",
        explanation: "The Fail Whale was Twitter's iconic error page (a whale being lifted by birds) shown during outages. In early Twitter, a monolithic Rails app handled everything. During traffic spikes (events, celebrity tweets), the app couldn't scale. Twitter's migration to a microservices architecture (2010-2012), replacing Rails with JVM services, Redis for timelines, and the fan-out service, largely solved the reliability issues.",
      },
      {
        question: "If a user follows 500 accounts and checks their timeline, how does the hybrid fan-out build their timeline?",
        format: "open",
        difficulty: 4,
        bloomLabel: "Apply",
        explanation: "**Step-by-step:** (1) Read the user's pre-computed timeline from Redis ZSET (contains tweets from accounts with < 5K followers that were pushed via fan-out-on-write). (2) Identify the user's followed 'celebrity' accounts (those with > 5K followers) — say 20 out of 500. (3) Fetch recent tweets from each celebrity account's tweet cache (20 lookups, can be parallelized). (4) Merge the pre-computed timeline with celebrity tweets by timestamp (sorted merge). (5) Apply ranking algorithm (engagement signals, ML model) to reorder. (6) Return the top 20-50 tweets for the first page. The pre-computed timeline is the fast path (~1ms), and celebrity tweet merging adds ~10-20ms. Total: well under 100ms.",
      },
      {
        question: "How does Twitter handle a tweet that is deleted — what needs to be updated?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "Just delete from the tweets table",
          "Delete from tweets table, remove from all follower timeline caches, remove from search index, invalidate CDN cache for media",
          "Mark as deleted but never actually remove",
          "Only hide from the author's profile",
        ],
        correctAnswer: "Delete from tweets table, remove from all follower timeline caches, remove from search index, invalidate CDN cache for media",
        explanation: "Tweet deletion is a reverse fan-out problem: (1) Soft-delete from the tweets table (mark deleted, hard-delete later). (2) Remove tweet_id from all follower timeline caches in Redis — this is expensive for celebrities (same N followers problem). (3) Remove from search index (Earlybird). (4) Invalidate CDN cache for any attached media. (5) Handle retweets and quotes of the deleted tweet. In practice, timeline cache removal is best-effort — the tweet disappears from timelines naturally as users scroll past it, and the API returns a 'tweet deleted' placeholder.",
      },
      {
        question: "What are the key differences between Twitter's home timeline and a user's profile timeline?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "They are the same",
          "Home timeline is an aggregated, ranked feed from all followed accounts (fan-out + merge). Profile timeline is a simple reverse-chronological list of one user's tweets (single table query).",
          "Home timeline is public, profile is private",
          "Home timeline includes ads, profile does not",
        ],
        correctAnswer: "Home timeline is an aggregated, ranked feed from all followed accounts (fan-out + merge). Profile timeline is a simple reverse-chronological list of one user's tweets (single table query).",
        explanation: "Home timeline is the complex one — it aggregates tweets from all accounts the user follows, using the hybrid fan-out approach, then ranks them. Profile timeline is much simpler: query the tweets table WHERE user_id = X ORDER BY created_at DESC. This is a single-partition query (tweets are sharded by user_id), making it fast and simple. The complexity difference is why system design interviews focus on the home timeline.",
      },
    ],
    cheatSheet: `# Design Twitter/X - Cheat Sheet

## Scale Numbers
| Metric | Value |
|--------|-------|
| MAU | ~400M |
| DAU | ~200M |
| Tweets/day | ~500M |
| Tweet QPS (avg) | ~6,000 |
| Timeline reads/day | ~1B+ |
| Avg followers/user | ~300 |

## Core Components
- **Tweet Service** - tweet CRUD, media upload
- **Fan-out Service** - push tweets to follower timelines
- **Timeline Service** - read pre-computed + merge celebrity tweets
- **Search Service** - Earlybird (real-time Lucene index)
- **Trending Service** - stream processing for trending topics
- **User Service** - profiles, authentication
- **Notification Service** - mentions, likes, retweets
- **CDN** - media delivery (images, videos)

## Technology Choices (Real)
| Component | Technology |
|-----------|-----------|
| Timeline Cache | Redis (Sorted Sets) |
| Tweet Store | Manhattan (custom KV) / MySQL+Gizzard |
| Search | Earlybird (Lucene-based) |
| ID Generation | Snowflake (64-bit: ts + machine + seq) |
| Message Queue | Kafka |
| Stream Processing | Heron (custom, Storm successor) |
| Media | Blob storage + CDN |

## Fan-out Strategy (Hybrid)
- **< 5K followers**: Fan-out on write (push to all follower timelines)
- **> 5K followers**: Fan-out on read (merge at timeline read time)
- **Timeline = pre-computed feed + celebrity tweet merge + ranking**

## Key Endpoints
\`\`\`
POST   /api/v2/tweets             -> create tweet
GET    /api/v2/timeline/home      -> home timeline (fan-out)
GET    /api/v2/users/{id}/tweets  -> user profile timeline
GET    /api/v2/search?q=xxx       -> search tweets
GET    /api/v2/trends             -> trending topics
POST   /api/v2/tweets/{id}/like   -> like tweet
POST   /api/v2/tweets/{id}/retweet -> retweet
\`\`\`

## Snowflake ID Structure (64 bits)
\`\`\`
[1 bit unused][41 bits timestamp][10 bits machine][12 bits sequence]
= ~4096 IDs/ms/machine, time-sorted, no coordination
\`\`\`

## Interview Tips
1. Fan-out is THE topic — hybrid approach is the answer
2. Know Snowflake ID generation cold
3. Timeline = Redis sorted set (score=timestamp)
4. Search = Earlybird (real-time Lucene index)
5. Trending = sliding window + Count-Min Sketch
`,
    ladder: buildLadder("Twitter/X"),
    resources: buildResources("Twitter/X", [
      {
        title: "Timelines at Scale - QCon Talk",
        author: "Raffi Krikorian (Twitter)",
        category: "youtube",
        justification: "The definitive talk on Twitter's fan-out architecture, directly from Twitter's VP of Engineering.",
        bestFor: "Understanding the fan-out problem and Twitter's hybrid solution",
        estimatedTime: "1 hour",
        cost: "Free",
        confidence: "HIGH",
        url: "https://www.infoq.com/presentations/Twitter-Timeline-Scalability/",
      },
    ]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STUDY 7: DESIGN SPOTIFY
// ════════════════════════════════════════════════════════════════════════════

function buildSpotify() {
  return {
    topic: "Design: Spotify (Detailed)",
    category: "System Design Cases",
    plan: {
      overview:
        "A comprehensive case study on designing Spotify — a music streaming platform with 600M+ users and 100M+ tracks. Covers audio streaming with adaptive bitrate, recommendation engine (Discover Weekly), offline playback, and the unique challenges of music licensing and royalty tracking.",
      skippedTopics: "Podcast platform, Spotify for Artists analytics, social features, audiobooks",
      sessions: [
        {
          sessionNumber: 1,
          title: "Requirements & Back-of-Envelope Estimation",
          paretoJustification: "Spotify's estimation reveals the audio-specific challenges: smaller files than video but stricter latency requirements (instant playback, no buffering).",
          objectives: [
            "Define requirements: search, play, playlist, offline, recommendations",
            "Calculate streaming bandwidth, storage, and concurrent stream count",
            "Understand the difference between music and video streaming architectures",
          ],
          activities: [
            { description: "List functional requirements for listeners and artists", durationMinutes: 10 },
            { description: "Estimate: 600M MAU, 220M premium, avg 30 min/day listening, 100M tracks in catalog", durationMinutes: 15 },
            { description: "Calculate: 1 song ~3.5MB at 320kbps, 100M tracks = ~350TB catalog", durationMinutes: 10 },
            { description: "Concurrent streams: ~50M at peak, bandwidth = 50M * 40KB/s = ~2TB/s", durationMinutes: 10 },
          ],
          resources: [
            { title: "Spotify Engineering Blog", type: "blog" },
            { title: "Audio Streaming Architecture", type: "blog" },
          ],
          reviewQuestions: [
            "How much storage does Spotify's entire music catalog require?",
            "What bandwidth does Spotify need for 50M concurrent streams at 320kbps?",
            "How does music streaming differ from video streaming architecturally?",
            "Why is instant playback (< 200ms to first byte) critical for Spotify?",
          ],
          successCriteria: "Can estimate storage, bandwidth, and identify audio-specific challenges.",
        },
        {
          sessionNumber: 2,
          title: "High-Level Architecture",
          paretoJustification: "Spotify's architecture uniquely combines content delivery (audio streaming), real-time features (currently playing), and batch ML (recommendations).",
          objectives: [
            "Design the high-level architecture with streaming, metadata, and recommendation paths",
            "Understand Spotify's evolution from P2P to client-server streaming",
            "Identify key services and their interactions",
          ],
          activities: [
            { description: "Draw architecture: Client -> CDN -> API Gateway -> Services -> Storage", durationMinutes: 15 },
            { description: "Design audio streaming flow: search -> get track metadata -> stream from CDN", durationMinutes: 15 },
            { description: "Design recommendation pipeline: user activity -> batch ML -> personalized playlists", durationMinutes: 15 },
            { description: "Identify services: Catalog, Streaming, Search, Recommendation, Playlist, User, Payment", durationMinutes: 10 },
          ],
          resources: [
            { title: "Spotify Backend Architecture", type: "blog" },
            { title: "From P2P to CDN: Spotify's Streaming Evolution", type: "blog" },
          ],
          reviewQuestions: [
            "Why did Spotify migrate from P2P to CDN-based streaming?",
            "What are the main services in Spotify's architecture?",
            "How does the recommendation pipeline differ from the real-time streaming path?",
            "What role does the CDN play in Spotify's architecture?",
          ],
          successCriteria: "Can draw a complete architecture with streaming, metadata, and recommendation paths.",
        },
        {
          sessionNumber: 3,
          title: "Database Design & Music Catalog",
          paretoJustification: "Spotify's catalog (100M+ tracks with rich metadata) requires careful schema design. The relationship between artists, albums, tracks, and playlists creates a complex data model.",
          objectives: [
            "Design schemas for tracks, albums, artists, playlists, and user activity",
            "Choose storage: PostgreSQL for metadata, blob store for audio, Cassandra for activity",
            "Design the playlist data model (collaborative playlists, generated playlists)",
          ],
          activities: [
            { description: "Design SQL schema: artists, albums, tracks, playlists, playlist_tracks, user_library", durationMinutes: 20 },
            { description: "Design audio file storage: multiple quality levels per track in blob storage", durationMinutes: 10 },
            { description: "Design user activity store: play history in Cassandra (write-optimized)", durationMinutes: 15 },
            { description: "Design collaborative playlist: operational transform or CRDT for concurrent edits", durationMinutes: 10 },
          ],
          resources: [
            { title: "Spotify Data Infrastructure", type: "blog" },
            { title: "Google Cloud Bigtable at Spotify", type: "blog" },
          ],
          reviewQuestions: [
            "How would you model the relationship between artists, albums, and tracks?",
            "Why use Cassandra for play history instead of PostgreSQL?",
            "How do you store multiple quality levels (96kbps, 160kbps, 320kbps) for each track?",
            "How would you handle concurrent edits to a collaborative playlist?",
          ],
          successCriteria: "Can design the complete data model with appropriate storage choices for each data type.",
        },
        {
          sessionNumber: 4,
          title: "API Design",
          paretoJustification: "Spotify's API must handle both metadata queries (search, browse) and real-time streaming — two fundamentally different interaction patterns.",
          objectives: [
            "Design REST APIs for search, browse, playlist management, and user library",
            "Design the streaming protocol for audio delivery",
            "Handle API authentication with OAuth 2.0 and rate limiting",
          ],
          activities: [
            { description: "Design catalog APIs: GET /tracks/{id}, GET /albums/{id}, GET /artists/{id}", durationMinutes: 10 },
            { description: "Design search API: GET /search?q=xxx&type=track,artist,album,playlist", durationMinutes: 10 },
            { description: "Design playlist APIs: CRUD + add/remove/reorder tracks", durationMinutes: 10 },
            { description: "Design streaming: GET /tracks/{id}/stream?quality=320 -> audio chunks via HTTP Range", durationMinutes: 15 },
          ],
          resources: [
            { title: "Spotify Web API Documentation", type: "docs" },
            { title: "HTTP Range Requests for Streaming", type: "docs" },
          ],
          reviewQuestions: [
            "How does Spotify stream audio — does it download the whole file first?",
            "What is an HTTP Range request and why is it used for audio streaming?",
            "How would you design the playlist reorder API to handle concurrent users?",
            "What authentication mechanism does Spotify use (hint: OAuth 2.0)?",
          ],
          successCriteria: "Can design REST APIs and explain the HTTP Range-based streaming protocol.",
        },
        {
          sessionNumber: 5,
          title: "Audio Streaming & Playback",
          paretoJustification: "The audio streaming pipeline (codec selection, buffering, gapless playback, crossfade) is Spotify's core technical challenge and differentiator.",
          objectives: [
            "Design the audio streaming pipeline: request -> CDN -> buffer -> decode -> play",
            "Understand audio codecs (OGG Vorbis, AAC) and quality levels",
            "Implement gapless playback and prefetching",
          ],
          activities: [
            { description: "Design streaming pipeline: track request -> CDN lookup -> HTTP Range requests -> client buffer -> decoder -> audio output", durationMinutes: 15 },
            { description: "Implement quality adaptation: auto-switch based on network speed", durationMinutes: 15 },
            { description: "Design prefetching: predict next track (queue/algorithm) and pre-buffer", durationMinutes: 10 },
            { description: "Implement gapless playback: pre-decode next track's first frames", durationMinutes: 10 },
          ],
          resources: [
            { title: "OGG Vorbis vs AAC Codecs", type: "docs" },
            { title: "Audio Streaming Best Practices", type: "blog" },
          ],
          reviewQuestions: [
            "How does Spotify achieve instant playback when you press a song?",
            "What is gapless playback and how is it implemented?",
            "Why does Spotify use OGG Vorbis instead of MP3?",
            "How does the client adapt audio quality to network conditions?",
          ],
          successCriteria: "Can design the complete audio streaming pipeline with prefetching and gapless playback.",
        },
        {
          sessionNumber: 6,
          title: "Recommendation Engine (Discover Weekly)",
          paretoJustification: "Spotify's recommendation engine is their biggest competitive advantage. Understanding collaborative filtering, content-based filtering, and the Discover Weekly pipeline shows ML-aware system design.",
          objectives: [
            "Understand collaborative filtering, content-based filtering, and audio analysis",
            "Design the Discover Weekly pipeline: data collection -> ML training -> playlist generation",
            "Implement the three recommendation approaches Spotify uses",
          ],
          activities: [
            { description: "Design collaborative filtering: 'users who listened to X also listened to Y'", durationMinutes: 15 },
            { description: "Design content-based: audio features (tempo, key, energy) + NLP on metadata", durationMinutes: 15 },
            { description: "Design Discover Weekly pipeline: weekly batch job combining all signals", durationMinutes: 15 },
            { description: "Design the Taste Profile: per-user vector of music preferences", durationMinutes: 10 },
          ],
          resources: [
            { title: "How Spotify Recommends Music - Engineering Blog", type: "blog" },
            { title: "Collaborative Filtering at Scale", type: "blog" },
          ],
          reviewQuestions: [
            "What is collaborative filtering and how does Spotify implement it?",
            "How does Spotify analyze audio features of songs for recommendations?",
            "How is Discover Weekly generated each week?",
            "What is the cold start problem for new users and new songs?",
          ],
          successCriteria: "Can explain the three recommendation approaches and design the Discover Weekly pipeline.",
        },
        {
          sessionNumber: 7,
          title: "Scalability & CDN Architecture",
          paretoJustification: "Serving 50M concurrent audio streams globally requires sophisticated CDN architecture and edge caching — understanding this is key for any content delivery system.",
          objectives: [
            "Design CDN architecture for global audio delivery",
            "Implement content caching: popular tracks at edge, long tail at origin",
            "Handle offline playback and DRM",
          ],
          activities: [
            { description: "Design CDN: edge POPs for popular tracks, regional for medium popularity, origin for long tail", durationMinutes: 15 },
            { description: "Implement popularity-based caching: top 1% of tracks serve 80% of streams", durationMinutes: 15 },
            { description: "Design offline playback: encrypted download, periodic license check", durationMinutes: 15 },
            { description: "Design DRM: Widevine/FairPlay for content protection", durationMinutes: 10 },
          ],
          resources: [
            { title: "Spotify CDN Architecture", type: "blog" },
            { title: "Content Delivery for Audio Streaming", type: "blog" },
          ],
          reviewQuestions: [
            "What percentage of Spotify streams come from the top 1% of tracks?",
            "How does Spotify handle the long tail — millions of tracks rarely played?",
            "How does offline playback work with DRM?",
            "What happens when a track's license expires while it's downloaded offline?",
          ],
          successCriteria: "Can design CDN architecture with popularity-based tiering and offline support.",
        },
        {
          sessionNumber: 8,
          title: "Reliability, Royalties & Monitoring",
          paretoJustification: "Spotify must track every single play for royalty payments — this creates a massive event processing pipeline that must be 100% reliable for financial accuracy.",
          objectives: [
            "Design the play-count and royalty tracking system",
            "Implement event processing for plays (Kafka + Spark)",
            "Design monitoring for stream quality, latency, and availability",
          ],
          activities: [
            { description: "Design play tracking: every play event -> Kafka -> aggregation -> royalty calculation", durationMinutes: 15 },
            { description: "Implement exactly-once processing for financial accuracy", durationMinutes: 15 },
            { description: "Design monitoring: buffer ratio, time to first byte, skip rate, crash rate", durationMinutes: 15 },
            { description: "Plan reliability for the streaming path: CDN failover, origin fallback", durationMinutes: 10 },
          ],
          resources: [
            { title: "Event Delivery at Spotify", type: "blog" },
            { title: "Royalty Tracking at Scale", type: "blog" },
          ],
          reviewQuestions: [
            "Why must play tracking be exactly-once for Spotify?",
            "How does Spotify use Kafka for event processing?",
            "What metrics indicate streaming quality issues?",
            "How does Spotify handle CDN edge server failures?",
          ],
          successCriteria: "Can design a reliable play-tracking pipeline and explain royalty calculation requirements.",
        },
      ],
    },
    quizBank: [
      {
        question: "How many tracks are in Spotify's music catalog?",
        format: "mcq",
        difficulty: 1,
        bloomLabel: "Remember",
        options: ["10 million", "50 million", "100 million+", "500 million"],
        correctAnswer: "100 million+",
        explanation: "Spotify has over 100 million tracks in its catalog as of 2024. However, popularity is extremely skewed — the top 1% of tracks account for roughly 80% of all streams. This long-tail distribution heavily influences caching and CDN strategy.",
      },
      {
        question: "What audio codec does Spotify primarily use for streaming?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Remember",
        options: ["MP3", "AAC", "OGG Vorbis", "FLAC"],
        correctAnswer: "OGG Vorbis",
        explanation: "Spotify uses OGG Vorbis for most streaming (96kbps, 160kbps, 320kbps quality levels). OGG Vorbis is open-source (no licensing fees, unlike MP3/AAC), offers quality comparable to AAC, and is well-suited for streaming. Spotify recently added support for AAC for web playback and is testing lossless (FLAC) for premium tiers.",
      },
      {
        question: "How does Spotify achieve nearly instant playback when you tap a song?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "The entire song is downloaded before playing",
          "Prefetching predicted next tracks + small initial buffer (200-500ms of audio) before playback starts + CDN edge proximity",
          "Songs are stored locally on all devices",
          "Spotify uses a faster internet protocol",
        ],
        correctAnswer: "Prefetching predicted next tracks + small initial buffer (200-500ms of audio) before playback starts + CDN edge proximity",
        explanation: "Instant playback comes from three strategies: (1) Prefetching: while the current song plays, Spotify predicts the next song (from queue or algorithm) and pre-downloads it. (2) Small buffer: only 200-500ms of audio needs to be buffered before playback can start, so even the first song plays almost instantly. (3) CDN edge: popular tracks are cached at edge servers close to the user, reducing round-trip time to ~10-20ms.",
      },
      {
        question: "What is collaborative filtering in the context of Spotify recommendations?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "Filtering songs that are collaboratively created by multiple artists",
          "Finding patterns in user behavior — 'users with similar listening history tend to like similar tracks' — to recommend new music",
          "Using audio analysis to find similar-sounding songs",
          "Filtering explicit content based on community guidelines",
        ],
        correctAnswer: "Finding patterns in user behavior — 'users with similar listening history tend to like similar tracks' — to recommend new music",
        explanation: "Collaborative filtering builds a matrix of users x tracks (based on play counts, saves, skips). It finds users with similar taste profiles and recommends tracks that similar users liked but the target user hasn't heard. Spotify uses matrix factorization (implicit feedback) at scale — the user-track matrix has 600M+ users and 100M+ tracks, so approximate methods (ALS - Alternating Least Squares) are used.",
      },
      {
        question: "Why must Spotify track every single play event with exactly-once semantics?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "For analytics dashboards only",
          "Each play triggers a royalty payment to rights holders — duplicate or missing counts directly affect how billions of dollars are distributed",
          "To calculate the user's monthly listening limit",
          "For copyright enforcement",
        ],
        correctAnswer: "Each play triggers a royalty payment to rights holders — duplicate or missing counts directly affect how billions of dollars are distributed",
        explanation: "Spotify pays royalties per stream. A counted play (typically > 30 seconds) generates a fraction of a cent for the rights holder. With billions of plays per day, even a 0.1% error in play counting affects royalty payouts by millions of dollars. This is why the play-tracking pipeline uses Kafka with exactly-once semantics and the data is reconciled and audited before royalty calculations.",
      },
      {
        question: "How does Spotify handle the 'long tail' of rarely-played tracks in their CDN?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Analyze",
        options: [
          "All tracks are replicated to all CDN edges",
          "Tiered caching: top tracks at edge POPs, medium popularity at regional CDNs, rare tracks served from origin — pulled to cache on first request",
          "Rare tracks are removed from the platform",
          "Rare tracks are only available for premium users",
        ],
        correctAnswer: "Tiered caching: top tracks at edge POPs, medium popularity at regional CDNs, rare tracks served from origin — pulled to cache on first request",
        explanation: "Spotify uses tiered caching based on popularity: Edge POPs (closest to users): cache the top ~5% of tracks that serve ~90% of streams. Regional CDNs: cache medium-popularity tracks. Origin servers: store all 100M+ tracks. When a rare track is requested, it's fetched from origin and cached at the regional/edge level with a TTL. If nobody requests it again, it naturally evicts. This minimizes storage costs while maintaining acceptable latency for rare tracks (first play may have ~200ms extra latency).",
      },
      {
        question: "What is Spotify's Discover Weekly and how is it technically generated?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "A hand-curated playlist by Spotify editors updated weekly",
          "A personalized playlist generated weekly using collaborative filtering + audio analysis + NLP, run as a batch job on Spark",
          "A random selection of 30 songs from the user's genres",
          "An algorithmically sorted version of the user's most-played songs",
        ],
        correctAnswer: "A personalized playlist generated weekly using collaborative filtering + audio analysis + NLP, run as a batch job on Spark",
        explanation: "Discover Weekly is generated for each of Spotify's 600M+ users every Monday. The pipeline: (1) Collaborative filtering identifies tracks liked by similar users. (2) Audio analysis (convolutional neural networks on raw audio) finds acoustically similar tracks. (3) NLP analyzes music blogs, reviews, and metadata for cultural similarity. (4) All signals are combined and ranked. (5) The batch job runs on Apache Spark, processing petabytes of listening data. (6) Results are personalized 30-track playlists stored in each user's account.",
      },
      {
        question: "How does offline playback work while respecting DRM?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Songs are downloaded as unprotected MP3 files",
          "Songs are encrypted with a device-specific key, stored locally, and require periodic online license verification (every 30 days)",
          "Offline mode uses a separate lower-quality audio format",
          "The device caches the streaming buffer permanently",
        ],
        correctAnswer: "Songs are encrypted with a device-specific key, stored locally, and require periodic online license verification (every 30 days)",
        explanation: "Offline playback: (1) When a user downloads a playlist, tracks are encrypted with a device-specific key (using Widevine on Android, FairPlay on iOS). (2) A license is stored locally with an expiration (typically 30 days). (3) The app can play encrypted tracks offline using the local key. (4) Every 30 days (or when the subscription lapses), the app must go online to renew the license. (5) If the license expires or the subscription is cancelled, downloaded tracks become unplayable. This protects rights holders while enabling offline listening.",
      },
      {
        question: "Design the data pipeline for tracking play events and calculating royalties.",
        format: "open",
        difficulty: 5,
        bloomLabel: "Create",
        explanation: "**Pipeline design:** (1) **Event generation:** Client sends play events (track_id, user_id, play_duration, timestamp, country) to API. A play counts if duration > 30 seconds. (2) **Ingestion:** Events are produced to Kafka (partitioned by user_id for ordering). (3) **Deduplication:** Kafka Streams consumer deduplicates by (user_id, track_id, timestamp) using a windowed state store. (4) **Enrichment:** Join with track metadata (artist, album, label, licensing agreements). (5) **Aggregation:** Daily batch job (Apache Spark) aggregates play counts per track per country. (6) **Royalty calculation:** Apply licensing formulas (varies by country, label, and agreement type). Total royalty pool = Spotify revenue * ~70%. Distribute proportionally based on stream share. (7) **Reconciliation:** Compare daily aggregates with real-time counts. Alert on discrepancies > 0.01%. (8) **Payment:** Monthly payout to rights holders via payment service. **Key requirement:** The pipeline must be exactly-once (Kafka transactions + idempotent writes to the aggregation store).",
      },
      {
        question: "What is the cold start problem for Spotify recommendations and how do they solve it?",
        format: "mcq",
        difficulty: 4,
        bloomLabel: "Analyze",
        options: [
          "The cold start problem doesn't exist for music platforms",
          "New users have no listening history for collaborative filtering, and new songs have no play data. Solved by: onboarding genre/artist selection, audio analysis for new songs, and popularity-based recommendations as fallback",
          "Cold start means the servers need to warm up",
          "It refers to the initial loading time of the app",
        ],
        correctAnswer: "New users have no listening history for collaborative filtering, and new songs have no play data. Solved by: onboarding genre/artist selection, audio analysis for new songs, and popularity-based recommendations as fallback",
        explanation: "Two cold start scenarios: (1) **New users:** No listening history means collaborative filtering can't find similar users. Solution: onboarding flow asks for favorite genres/artists, use demographic data (country, age), start with popularity-based recommendations, and rapidly update the taste profile as the user listens. (2) **New songs:** No play data means collaborative filtering ignores them. Solution: analyze audio features (tempo, key, energy, mood) using CNNs trained on raw audio, match to existing songs with similar features, and inject new songs into 'Release Radar' playlists for exposure.",
      },
    ],
    cheatSheet: `# Design Spotify - Cheat Sheet

## Scale Numbers
| Metric | Value |
|--------|-------|
| MAU | 600M+ |
| Premium subscribers | 220M+ |
| Tracks in catalog | 100M+ |
| Daily active streams | Billions |
| Concurrent streams (peak) | ~50M |
| Audio file sizes | 3.5MB (320kbps, 3 min song) |
| Total catalog storage | ~350TB |

## Core Components
- **Streaming Service** - audio delivery via CDN + HTTP Range
- **Catalog Service** - track/album/artist metadata
- **Search Service** - Elasticsearch for catalog search
- **Recommendation Engine** - collaborative filtering + audio ML
- **Playlist Service** - user playlists, Discover Weekly
- **User Service** - accounts, preferences, library
- **Payment Service** - subscriptions, trials
- **Royalty Pipeline** - play tracking for payments

## Technology Choices
| Component | Technology |
|-----------|-----------|
| Audio Storage | Google Cloud Storage + CDN |
| Metadata DB | PostgreSQL + Cassandra |
| Event Processing | Kafka + Spark |
| ML/Recommendations | TensorFlow + Spark MLlib |
| Search | Elasticsearch |
| Cache | Memcached + Redis |
| Audio Codec | OGG Vorbis (96/160/320 kbps) |
| DRM | Widevine (Android) / FairPlay (iOS) |

## Audio Streaming Flow
\`\`\`
1. Client requests track -> API returns CDN URL + token
2. Client sends HTTP Range request to CDN
3. CDN serves audio chunks (if cached) or fetches from origin
4. Client buffers 200-500ms then starts playback
5. While playing, prefetch predicted next track
\`\`\`

## Recommendation Approaches
1. **Collaborative Filtering** - "similar users liked this"
2. **Content-Based** - audio feature analysis (CNNs on raw audio)
3. **NLP-Based** - analyze music blogs, metadata, reviews
4. **Combined** -> Discover Weekly (30 tracks/user/week)

## Interview Tips
1. Spotify is simpler than YouTube (smaller files, no transcoding)
2. Focus on: CDN tiering, recommendation pipeline, royalty tracking
3. Key differentiator: instant playback + prefetching
4. Mention: DRM for offline, exactly-once for royalties
5. Deep dive: Discover Weekly pipeline or CDN architecture
`,
    ladder: buildLadder("Spotify"),
    resources: buildResources("Spotify", [
      {
        title: "Spotify Engineering Blog",
        author: "Spotify",
        category: "blogs",
        justification: "Spotify publishes detailed articles about their data infrastructure, ML pipeline, and audio streaming architecture.",
        bestFor: "Understanding music streaming and recommendation systems at scale",
        estimatedTime: "6 hours",
        cost: "Free",
        confidence: "HIGH",
        url: "https://engineering.atspotify.com/",
      },
    ]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CASE STUDY 8: DESIGN STRIPE
// ════════════════════════════════════════════════════════════════════════════

function buildStripe() {
  return {
    topic: "Design: Stripe (Detailed)",
    category: "System Design Cases",
    plan: {
      overview:
        "A comprehensive case study on designing Stripe — a payment processing platform handling hundreds of billions of dollars annually. Covers payment flow (authorization, capture, settlement), idempotency, PCI DSS compliance, fraud detection, and the critical requirement of exactly-once payment processing in a distributed system.",
      skippedTopics: "Stripe Atlas (incorporation), Stripe Climate, Stripe Identity, Stripe Issuing",
      sessions: [
        {
          sessionNumber: 1,
          title: "Requirements & Back-of-Envelope Estimation",
          paretoJustification: "Payment systems have unique requirements: zero tolerance for data loss, strict regulatory compliance (PCI DSS), and the need for idempotent operations. Understanding these constraints is essential.",
          objectives: [
            "Define requirements: charge, refund, subscription, webhook, dispute handling",
            "Calculate transaction QPS, data sensitivity requirements, and latency constraints",
            "Understand PCI DSS compliance and its architectural implications",
          ],
          activities: [
            { description: "List merchant requirements: accept payments, refunds, subscriptions, invoices, payouts", durationMinutes: 10 },
            { description: "Estimate: millions of merchants, ~1000 transactions/sec avg, $hundreds of billions/year", durationMinutes: 15 },
            { description: "Define non-functional: 99.999% availability for payments, < 2s latency, zero data loss", durationMinutes: 10 },
            { description: "Understand PCI DSS: cardholder data encryption, network segmentation, audit logs", durationMinutes: 10 },
          ],
          resources: [
            { title: "Stripe Engineering Blog", type: "blog" },
            { title: "PCI DSS Requirements Overview", type: "docs" },
          ],
          reviewQuestions: [
            "Why is 99.999% availability (5.26 min downtime/year) required for a payment system?",
            "What is PCI DSS and how does it affect architecture?",
            "What is the difference between authorization and capture in payment processing?",
            "Why is idempotency critical for payment APIs?",
          ],
          successCriteria: "Can identify the unique constraints of payment systems and PCI DSS implications.",
        },
        {
          sessionNumber: 2,
          title: "High-Level Architecture",
          paretoJustification: "Payment system architecture is fundamentally different from content platforms — it prioritizes correctness over availability and requires an audit trail for every operation.",
          objectives: [
            "Design the high-level architecture with payment flow and settlement",
            "Understand the role of payment gateways, processors, and card networks",
            "Design the integration with external banking infrastructure",
          ],
          activities: [
            { description: "Draw architecture: Merchant -> Stripe API -> Payment Service -> Gateway -> Card Network -> Issuing Bank", durationMinutes: 15 },
            { description: "Design the payment flow: authorize -> capture -> settle -> payout", durationMinutes: 15 },
            { description: "Design internal services: Payment, Fraud, Webhook, Subscription, Ledger, Payout", durationMinutes: 10 },
            { description: "Design the async settlement pipeline: daily batch settlement with banks", durationMinutes: 15 },
          ],
          resources: [
            { title: "How Credit Card Processing Works", type: "blog" },
            { title: "Stripe Architecture Overview", type: "blog" },
          ],
          reviewQuestions: [
            "What is the difference between a payment gateway and a payment processor?",
            "Why are authorization and capture separate steps?",
            "What happens during settlement and how long does it take?",
            "How does Stripe communicate with card networks (Visa, Mastercard)?",
          ],
          successCriteria: "Can draw the complete payment flow through all parties (merchant, Stripe, network, bank).",
        },
        {
          sessionNumber: 3,
          title: "Database Design & Financial Ledger",
          paretoJustification: "The financial ledger is the source of truth for all money movement. Double-entry bookkeeping and immutable audit logs are non-negotiable in financial systems.",
          objectives: [
            "Design the financial ledger with double-entry bookkeeping",
            "Implement immutable audit logs for every transaction",
            "Design schemas for merchants, customers, charges, refunds, and payouts",
          ],
          activities: [
            { description: "Design double-entry ledger: every transaction creates a debit AND credit entry", durationMinutes: 20 },
            { description: "Design SQL schema: merchants, customers, payment_methods, charges, refunds, ledger_entries", durationMinutes: 15 },
            { description: "Implement immutable audit log: append-only table with full event details", durationMinutes: 10 },
            { description: "Design card data storage (tokenization for PCI compliance)", durationMinutes: 10 },
          ],
          resources: [
            { title: "Double-Entry Bookkeeping for Engineers", type: "blog" },
            { title: "PCI DSS Tokenization", type: "docs" },
          ],
          reviewQuestions: [
            "What is double-entry bookkeeping and why is it used in payment systems?",
            "How does tokenization work for storing credit card numbers?",
            "Why must ledger entries be immutable (never updated, only appended)?",
            "How do you handle a refund in a double-entry ledger?",
          ],
          successCriteria: "Can design a double-entry ledger with immutable audit logs and PCI-compliant card storage.",
        },
        {
          sessionNumber: 4,
          title: "API Design & Idempotency",
          paretoJustification: "Stripe's API is considered the gold standard in API design. Understanding their idempotency keys, versioning, and error handling patterns is directly applicable to any API design interview.",
          objectives: [
            "Design the payment API with idempotency keys",
            "Implement API versioning (Stripe's date-based versioning)",
            "Design webhook delivery with retry and signature verification",
          ],
          activities: [
            { description: "Design charge API: POST /v1/charges with Idempotency-Key header", durationMinutes: 15 },
            { description: "Implement idempotency: store (idempotency_key -> response) for 24 hours", durationMinutes: 15 },
            { description: "Design webhook system: event -> queue -> deliver with exponential backoff", durationMinutes: 15 },
            { description: "Implement API versioning: date-based (2023-10-16), backward compatible", durationMinutes: 10 },
          ],
          resources: [
            { title: "Stripe API Documentation", type: "docs" },
            { title: "Designing Robust APIs - Stripe Blog", type: "blog" },
          ],
          reviewQuestions: [
            "What is an idempotency key and how does it prevent double charges?",
            "How does Stripe's date-based API versioning work?",
            "What happens if a webhook delivery fails?",
            "How do you verify that a webhook came from Stripe (hint: HMAC signature)?",
          ],
          successCriteria: "Can design payment APIs with idempotency keys and webhook delivery with retries.",
        },
        {
          sessionNumber: 5,
          title: "Payment Processing & State Machine",
          paretoJustification: "The payment state machine (created -> authorized -> captured -> settled -> paid out) is the core domain logic. Getting state transitions right in a distributed system is the hardest part of payment processing.",
          objectives: [
            "Design the payment state machine with all transitions",
            "Handle partial captures, refunds, and disputes",
            "Implement saga pattern for multi-step payment operations",
          ],
          activities: [
            { description: "Design state machine: created -> processing -> authorized -> captured -> settled -> failed/refunded/disputed", durationMinutes: 20 },
            { description: "Implement the saga pattern for: charge card -> record ledger -> notify merchant", durationMinutes: 15 },
            { description: "Handle edge cases: timeout during authorization, partial refunds, chargeback disputes", durationMinutes: 15 },
            { description: "Design retry logic for failed authorizations (exponential backoff, circuit breaker)", durationMinutes: 10 },
          ],
          resources: [
            { title: "Payment State Machines", type: "blog" },
            { title: "Saga Pattern in Distributed Transactions", type: "blog" },
          ],
          reviewQuestions: [
            "What are all the possible states of a payment and what triggers each transition?",
            "What is the saga pattern and why is it used instead of distributed transactions?",
            "How do you handle a timeout during credit card authorization?",
            "What is a partial refund and how does it affect the ledger?",
          ],
          successCriteria: "Can design the complete payment state machine and explain saga pattern for multi-step operations.",
        },
        {
          sessionNumber: 6,
          title: "Fraud Detection & Risk Management",
          paretoJustification: "Fraud detection in real-time (sub-100ms) is one of the most challenging ML inference problems. Understanding Stripe Radar's approach shows awareness of the business-critical nature of fraud prevention.",
          objectives: [
            "Design real-time fraud detection scoring (Stripe Radar)",
            "Implement rule-based and ML-based fraud detection",
            "Handle 3D Secure (3DS) challenge for suspicious transactions",
          ],
          activities: [
            { description: "Design fraud scoring pipeline: transaction features -> ML model -> risk score -> accept/reject/challenge", durationMinutes: 15 },
            { description: "Implement rule-based checks: velocity limits, geographic anomalies, card testing detection", durationMinutes: 15 },
            { description: "Design ML features: transaction amount, merchant category, device fingerprint, behavioral patterns", durationMinutes: 15 },
            { description: "Implement 3D Secure flow for elevated-risk transactions", durationMinutes: 10 },
          ],
          resources: [
            { title: "Stripe Radar - ML Fraud Detection", type: "docs" },
            { title: "Real-Time Fraud Detection at Scale", type: "blog" },
          ],
          reviewQuestions: [
            "What is the latency budget for fraud scoring in a payment flow?",
            "What features would you use for a fraud detection ML model?",
            "What is 3D Secure and when is it triggered?",
            "How do you detect card testing attacks?",
          ],
          successCriteria: "Can design a real-time fraud detection pipeline with both rules and ML scoring.",
        },
        {
          sessionNumber: 7,
          title: "Scalability & Multi-Region Architecture",
          paretoJustification: "Payment systems must be available in multiple regions for regulatory compliance (data sovereignty) and low latency — but consistency requirements make multi-region much harder than for content platforms.",
          objectives: [
            "Design multi-region deployment with data sovereignty",
            "Handle cross-region payment routing",
            "Implement database replication with strong consistency for financial data",
          ],
          activities: [
            { description: "Design multi-region: EU data stays in EU, US data stays in US (GDPR/PSD2 compliance)", durationMinutes: 15 },
            { description: "Implement payment routing: route to the card network's preferred region", durationMinutes: 15 },
            { description: "Design database replication: synchronous for ledger (strong consistency), async for analytics", durationMinutes: 15 },
            { description: "Handle region failover: active-passive with manual failover for financial data", durationMinutes: 10 },
          ],
          resources: [
            { title: "Multi-Region at Stripe", type: "blog" },
            { title: "GDPR and Payment Data Sovereignty", type: "docs" },
          ],
          reviewQuestions: [
            "Why is active-passive preferred over active-active for payment data?",
            "How does data sovereignty affect payment system architecture?",
            "Why must ledger data use synchronous replication?",
            "How do you route a payment to the optimal region?",
          ],
          successCriteria: "Can design multi-region architecture with proper data sovereignty and consistency.",
        },
        {
          sessionNumber: 8,
          title: "Reliability, Reconciliation & Monitoring",
          paretoJustification: "In payment systems, reliability is measured in dollars — every failure or inconsistency directly impacts financial accuracy. Reconciliation is the safety net that catches errors.",
          objectives: [
            "Design reconciliation between internal ledger and bank statements",
            "Implement monitoring for payment success rate, latency, and fraud rate",
            "Design disaster recovery with zero data loss (RPO=0)",
          ],
          activities: [
            { description: "Design reconciliation: compare internal ledger with bank/network settlement files daily", durationMinutes: 15 },
            { description: "Handle discrepancies: automated resolution for known patterns, manual review for unknowns", durationMinutes: 10 },
            { description: "Design monitoring: payment success rate (target: 99.9%+), p99 latency, fraud rate, dispute rate", durationMinutes: 15 },
            { description: "Plan DR: synchronous replication, point-in-time recovery, zero-RPO failover", durationMinutes: 15 },
          ],
          resources: [
            { title: "Payment Reconciliation at Scale", type: "blog" },
            { title: "Financial System Reliability", type: "blog" },
          ],
          reviewQuestions: [
            "What is reconciliation and why is it done daily?",
            "What is the difference between RPO (Recovery Point Objective) and RTO (Recovery Time Objective)?",
            "What payment success rate should you target and what causes failures?",
            "How do you handle a discrepancy found during reconciliation?",
          ],
          successCriteria: "Can design reconciliation, monitoring, and DR strategies for a payment system.",
        },
      ],
    },
    quizBank: [
      {
        question: "What is an idempotency key in Stripe's API?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "An API key for authentication",
          "A unique key sent with the request that ensures the same operation is not performed twice — if the key was seen before, the stored response is returned",
          "A key for encrypting payment data",
          "A session identifier",
        ],
        correctAnswer: "A unique key sent with the request that ensures the same operation is not performed twice — if the key was seen before, the stored response is returned",
        explanation: "Stripe's Idempotency-Key header (e.g., a UUID) ensures that retrying a failed request doesn't create duplicate charges. The server stores the mapping (idempotency_key -> response) for 24 hours. If the same key is sent again, the stored response is returned without re-executing the operation. This is critical because network failures during payment processing are common — the merchant doesn't know if the charge succeeded.",
      },
      {
        question: "What is double-entry bookkeeping in the context of a payment ledger?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "Recording each transaction twice for backup",
          "Every financial transaction creates two entries: a debit from one account and a credit to another, ensuring the total always balances to zero",
          "Using two different databases for redundancy",
          "Checking each transaction with two approvers",
        ],
        correctAnswer: "Every financial transaction creates two entries: a debit from one account and a credit to another, ensuring the total always balances to zero",
        explanation: "In double-entry bookkeeping, every transaction creates exactly two entries: a debit (money leaving an account) and a credit (money entering an account). For example, when a customer pays $100: debit $100 from customer's balance, credit $100 to merchant's balance. The sum of all debits must equal the sum of all credits. This invariant makes it easy to detect errors — if the books don't balance, something went wrong.",
      },
      {
        question: "What is the difference between authorization and capture in credit card processing?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "They are the same thing",
          "Authorization verifies the card and places a hold on funds; capture actually transfers the money — they can happen at different times",
          "Authorization is for credit cards, capture is for debit cards",
          "Authorization is the API call, capture is the webhook",
        ],
        correctAnswer: "Authorization verifies the card and places a hold on funds; capture actually transfers the money — they can happen at different times",
        explanation: "Authorization contacts the issuing bank to verify the card is valid and has sufficient funds, then places a hold. Capture actually initiates the fund transfer. They are often separate because: (1) Hotels authorize at check-in but capture at checkout (when the final amount is known). (2) E-commerce authorizes at order but captures at shipment. (3) The hold typically expires after 7 days if not captured.",
      },
      {
        question: "Why is PCI DSS compliance important for a payment system?",
        format: "mcq",
        difficulty: 2,
        bloomLabel: "Understand",
        options: [
          "It is optional but recommended",
          "PCI DSS (Payment Card Industry Data Security Standard) is mandatory for any system handling cardholder data — non-compliance can result in fines of $5K-100K/month and loss of ability to process cards",
          "It only applies to banks, not payment processors",
          "It is a performance optimization standard",
        ],
        correctAnswer: "PCI DSS (Payment Card Industry Data Security Standard) is mandatory for any system handling cardholder data — non-compliance can result in fines of $5K-100K/month and loss of ability to process cards",
        explanation: "PCI DSS requires: encryption of cardholder data at rest and in transit, network segmentation (cardholder data environment isolated from other systems), access controls and audit logs, regular security assessments, and vulnerability management. Stripe handles PCI compliance for merchants through tokenization — merchants never see raw card numbers, only Stripe tokens.",
      },
      {
        question: "What is tokenization and how does it help with PCI compliance?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Converting currency to cryptocurrency tokens",
          "Replacing sensitive card data with a non-sensitive token (e.g., 'tok_abc123') — the merchant stores only the token, never the card number, reducing their PCI scope",
          "Breaking payment data into smaller pieces",
          "Encrypting data with a token-based algorithm",
        ],
        correctAnswer: "Replacing sensitive card data with a non-sensitive token (e.g., 'tok_abc123') — the merchant stores only the token, never the card number, reducing their PCI scope",
        explanation: "When a customer enters their card number on Stripe's secure form (Stripe.js), the card number goes directly to Stripe's PCI-compliant servers and is replaced with a token (e.g., 'tok_abc123'). The merchant's server only sees this token. The merchant can charge, refund, and manage subscriptions using just the token. Since the merchant never handles raw card data, their PCI compliance burden is dramatically reduced (from PCI Level 1 to SAQ-A, the simplest level).",
      },
      {
        question: "What is the saga pattern and why is it used in payment processing?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "A design pattern for long-running user interfaces",
          "A pattern for managing distributed transactions: each step has a compensating action, and if any step fails, previously completed steps are reversed (e.g., refund if ledger write fails)",
          "A pattern for batch processing",
          "A pattern for real-time streaming",
        ],
        correctAnswer: "A pattern for managing distributed transactions: each step has a compensating action, and if any step fails, previously completed steps are reversed (e.g., refund if ledger write fails)",
        explanation: "In payment processing, a charge involves multiple services: fraud check -> authorize card -> write ledger -> notify merchant. Traditional distributed transactions (2PC) are too slow and fragile. The saga pattern: each step has a compensating action (e.g., compensating for 'authorize card' is 'void authorization'). If step 3 (ledger write) fails, the saga executes compensating actions in reverse: void the authorization. This provides eventual consistency without distributed locks.",
      },
      {
        question: "How does Stripe Radar detect fraud in real-time?",
        format: "mcq",
        difficulty: 3,
        bloomLabel: "Understand",
        options: [
          "Manual review of every transaction",
          "ML model scoring each transaction in < 100ms using features like: transaction amount, velocity, device fingerprint, geographic signals, behavioral patterns, and network-wide fraud signals",
          "Checking against a static blacklist",
          "Requiring 2FA for every transaction",
        ],
        correctAnswer: "ML model scoring each transaction in < 100ms using features like: transaction amount, velocity, device fingerprint, geographic signals, behavioral patterns, and network-wide fraud signals",
        explanation: "Stripe Radar uses ML models trained on billions of transactions across Stripe's entire network. Features include: (1) Transaction: amount, currency, merchant category. (2) Velocity: number of attempts in last hour/day. (3) Device: fingerprint, IP geolocation, browser. (4) Behavioral: typical spending patterns for this card. (5) Network: is this card being used across multiple Stripe merchants suspiciously? The model returns a risk score in < 100ms. High risk -> decline or trigger 3D Secure. Stripe's network-wide visibility (seeing transactions across millions of merchants) is a key advantage.",
      },
      {
        question: "Why does Stripe use synchronous database replication for ledger data instead of asynchronous?",
        format: "mcq",
        difficulty: 4,
        bloomLabel: "Analyze",
        options: [
          "Synchronous is always faster",
          "Financial data cannot tolerate data loss (RPO=0). Synchronous replication ensures the replica has the data before the primary confirms the write, guaranteeing zero data loss even if the primary fails",
          "Asynchronous replication is not supported by their database",
          "Regulatory requirement for all databases",
        ],
        correctAnswer: "Financial data cannot tolerate data loss (RPO=0). Synchronous replication ensures the replica has the data before the primary confirms the write, guaranteeing zero data loss even if the primary fails",
        explanation: "In asynchronous replication, the primary confirms writes before the replica has the data. If the primary fails, unconfirmed writes are lost. For a payment ledger, losing even one transaction record means money is unaccounted for. Synchronous replication: the primary waits for the replica to confirm before acknowledging the write. Trade-off: higher write latency (additional round-trip to replica). For a payment system, this ~1-2ms extra latency is acceptable in exchange for zero data loss (RPO=0).",
      },
      {
        question: "Design the idempotency implementation for Stripe's charge API.",
        format: "open",
        difficulty: 4,
        bloomLabel: "Create",
        explanation: "**Implementation:** (1) Client sends POST /v1/charges with header Idempotency-Key: <uuid>. (2) Server checks idempotency store (Redis or database): GET idempotency:<key>. (3) **If found:** Return the stored response immediately (200 or error, exactly as before). (4) **If not found:** Acquire a lock on the key (SET idempotency:<key> 'processing' NX EX 60). If lock fails, another request is in progress — return 409 Conflict. (5) Process the charge normally. (6) Store the response: SET idempotency:<key> <serialized_response> EX 86400 (24h TTL). (7) Return the response. **Edge cases:** (a) If the server crashes mid-processing, the 60s lock expires and the client can retry. (b) If the response is an error, store it — the client should get the same error on retry, not a new attempt. (c) The 24h TTL means keys can be reused after expiration. **Storage:** Redis for fast lookups, with periodic backup to the database for durability.",
      },
      {
        question: "What is reconciliation in a payment system and why is it critical?",
        format: "open",
        difficulty: 4,
        bloomLabel: "Evaluate",
        explanation: "**Reconciliation** is the process of comparing internal records with external records to ensure they match. For Stripe: (1) **Internal ledger:** All charges, refunds, and payouts recorded in Stripe's database. (2) **External records:** Settlement files from card networks (Visa, Mastercard), bank statements, and processor reports. (3) **Process:** Daily batch job compares internal and external records. For each transaction, verify: amount matches, status matches, timing is within expected window. (4) **Discrepancies:** (a) Stripe shows a charge but the network doesn't -> possible authorization that was voided. (b) Network shows a charge but Stripe doesn't -> critical error, investigate immediately. (c) Amount mismatch -> currency conversion issue or partial capture. (5) **Resolution:** Automated rules handle ~95% of discrepancies (known patterns like timing differences). Remaining 5% go to a human operations team. (6) **Why critical:** Without reconciliation, money could be lost, merchants could be overpaid or underpaid, and regulatory audits would fail. It's the ultimate safety net for financial accuracy.",
      },
    ],
    cheatSheet: `# Design Stripe - Cheat Sheet

## Scale Numbers
| Metric | Value |
|--------|-------|
| Merchants | Millions |
| Transaction QPS (avg) | ~1,000+ |
| Annual volume | $hundreds of billions |
| Availability target | 99.999% (5 min downtime/yr) |
| Payment latency target | < 2 seconds |
| Fraud detection latency | < 100ms |

## Core Components
- **API Gateway** - authentication, rate limiting, routing
- **Payment Service** - charge lifecycle (authorize, capture, refund)
- **Fraud Service** - ML-based Radar scoring in real-time
- **Ledger Service** - double-entry bookkeeping, immutable
- **Webhook Service** - event delivery with retries
- **Subscription Service** - recurring billing, invoicing
- **Payout Service** - merchant payouts (T+2 settlement)
- **Tokenization Service** - PCI-compliant card storage

## Payment Flow
\`\`\`
Merchant -> Stripe API -> Fraud Check -> Card Network -> Issuing Bank
                                    <- Authorization (approve/decline)
         -> Capture (batch, T+1) -> Settlement -> Payout to Merchant
\`\`\`

## Payment State Machine
\`\`\`
CREATED -> PROCESSING -> AUTHORIZED -> CAPTURED -> SETTLED -> PAID_OUT
              |               |            |
              v               v            v
           FAILED         VOIDED      REFUNDED/DISPUTED
\`\`\`

## Key API Endpoints
\`\`\`
POST   /v1/charges           -> create charge (+ Idempotency-Key)
POST   /v1/charges/{id}/capture -> capture authorized charge
POST   /v1/refunds           -> refund a charge
POST   /v1/subscriptions     -> create subscription
GET    /v1/events             -> list webhook events
POST   /v1/webhook_endpoints  -> register webhook URL
\`\`\`

## Idempotency Pattern
\`\`\`
Client: POST /v1/charges
        Header: Idempotency-Key: <uuid>
Server: Check key in store
        -> Found: return stored response
        -> Not found: process, store response, return
        TTL: 24 hours
\`\`\`

## Double-Entry Ledger
\`\`\`
Charge $100:
  DEBIT  customer_balance  $100
  CREDIT merchant_balance  $100

Refund $30:
  DEBIT  merchant_balance  $30
  CREDIT customer_balance  $30

Invariant: SUM(debits) = SUM(credits) ALWAYS
\`\`\`

## Interview Tips
1. Payment systems prioritize CORRECTNESS over performance
2. Idempotency is THE key pattern — know it cold
3. Double-entry ledger + immutable audit log = financial safety
4. PCI DSS -> tokenization -> merchant never sees card numbers
5. Deep dive: payment state machine or fraud detection pipeline
`,
    ladder: buildLadder("Stripe"),
    resources: buildResources("Stripe", [
      {
        title: "Stripe Engineering Blog",
        author: "Stripe",
        category: "blogs",
        justification: "Stripe publishes excellent articles on API design, distributed systems, and ML for fraud detection.",
        bestFor: "Learning payment system design and API best practices",
        estimatedTime: "6 hours",
        cost: "Free",
        confidence: "HIGH",
        url: "https://stripe.com/blog/engineering",
      },
    ]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN: Generate and write the JSON file
// ════════════════════════════════════════════════════════════════════════════

function main() {
  const caseStudies = [
    buildYouTube(),
    buildInstagram(),
    buildUber(),
    buildAirbnb(),
    buildWhatsApp(),
    buildTwitter(),
    buildSpotify(),
    buildStripe(),
  ];

  // Validate
  let totalSessions = 0;
  let totalQuizQuestions = 0;
  for (const cs of caseStudies) {
    const sessions = cs.plan.sessions.length;
    const quizzes = cs.quizBank.length;
    totalSessions += sessions;
    totalQuizQuestions += quizzes;
    console.log(`  ${cs.topic}: ${sessions} sessions, ${quizzes} quiz questions`);
  }
  console.log(`\nTotal: ${caseStudies.length} case studies, ${totalSessions} sessions, ${totalQuizQuestions} quiz questions`);

  // Write JSON
  const outDir = path.join(__dirname, "..", "public", "content");
  const outPath = path.join(outDir, "system-design-cases-detailed.json");

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write minified JSON (consistent with other content files)
  fs.writeFileSync(outPath, JSON.stringify(caseStudies), "utf-8");

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`\nWrote ${outPath} (${sizeKB} KB)`);
}

main();
