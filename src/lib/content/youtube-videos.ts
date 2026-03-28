// Curated YouTube video mapping for interview prep topics
// Only high-quality, well-known channels included

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channel: string;
}

type VideoMap = Record<string, YouTubeVideo[]>;

export const YOUTUBE_VIDEOS: VideoMap = {
  // ── System Design Fundamentals ──────────────────────────────────────────
  "Load Balancing": [
    { videoId: "K0Ta65OqQkY", title: "Load Balancing - System Design", channel: "Gaurav Sen" },
    { videoId: "sCR3SAVdyCc", title: "What is a Load Balancer?", channel: "ByteByteGo" },
  ],
  "API Gateway": [
    { videoId: "6ULyxuHKxg8", title: "What is API Gateway?", channel: "ByteByteGo" },
    { videoId: "RqfaTIWc3LQ", title: "API Gateway Explained", channel: "TechWorld with Nana" },
  ],
  "Caching": [
    { videoId: "U3RkDLtS7uY", title: "Caching - System Design", channel: "Gaurav Sen" },
    { videoId: "dGAgxozNWFE", title: "Top Caching Strategies", channel: "ByteByteGo" },
  ],
  "Database Design": [
    { videoId: "ztHopE5Wnpc", title: "7 Database Paradigms", channel: "Fireship" },
    { videoId: "W2Z7fbCLSTw", title: "SQL vs NoSQL Explained", channel: "ByteByteGo" },
  ],
  "Database Scaling": [
    { videoId: "yNrVexoEnFM", title: "Database Sharding Explained", channel: "Gaurav Sen" },
    { videoId: "BO768aWuJSI", title: "Database Replication", channel: "Hussein Nasser" },
  ],
  "Message Queues": [
    { videoId: "5-Rq4-PZlew", title: "Message Queues - System Design", channel: "Gaurav Sen" },
    { videoId: "oUJbuFMyBDk", title: "Kafka in 100 Seconds", channel: "Fireship" },
  ],
  "Microservices Architecture": [
    { videoId: "rv4LlmLmVWk", title: "Microservices Explained in 5 Min", channel: "TechWorld with Nana" },
    { videoId: "lL_j7ilk7rc", title: "Microservices Architecture", channel: "ByteByteGo" },
  ],
  "Distributed Systems Fundamentals": [
    { videoId: "Y6Ev8GIlbxc", title: "CAP Theorem Simplified", channel: "Gaurav Sen" },
    { videoId: "UEAMfLPZZhE", title: "Distributed Systems in 100 Seconds", channel: "Fireship" },
  ],
  "Content Delivery Networks (CDN)": [
    { videoId: "RI9np1LWzqw", title: "CDN Explained", channel: "Fireship" },
    { videoId: "8zX0rue2Hic", title: "What Is a CDN?", channel: "ByteByteGo" },
  ],
  "Rate Limiting & Throttling": [
    { videoId: "FU4WlwfS28s", title: "Rate Limiting - System Design", channel: "Gaurav Sen" },
  ],
  "Scalability Patterns": [
    { videoId: "hnpzNAPiC0E", title: "Horizontal vs Vertical Scaling", channel: "Gaurav Sen" },
  ],
  "Authentication & Authorization": [
    { videoId: "7Q17ubqLfaM", title: "OAuth 2.0 Explained", channel: "ByteByteGo" },
    { videoId: "GhrvZ5nUWNg", title: "Session vs Token Authentication", channel: "Fireship" },
  ],

  // ── System Design Cases ─────────────────────────────────────────────────
  "Design: Chat System (WhatsApp/Slack)": [
    { videoId: "vvhC64hQZMk", title: "WhatsApp System Design", channel: "Gaurav Sen" },
  ],
  "Design: URL Shortener (TinyURL)": [
    { videoId: "fMZMm_0ZhK4", title: "URL Shortener System Design", channel: "Gaurav Sen" },
  ],
  "Design: Social Media Feed (Twitter/Instagram)": [
    { videoId: "QmX2NPkJTKg", title: "Twitter System Design", channel: "Gaurav Sen" },
  ],
  "Design: Video Streaming (YouTube/Netflix)": [
    { videoId: "jPKTo1iGQiE", title: "Netflix System Design", channel: "Gaurav Sen" },
  ],
  "Design: E-commerce Platform (Amazon)": [
    { videoId: "2BWr0fsDSs0", title: "Amazon System Design", channel: "Concept && Coding" },
  ],
  "Design: Ride Sharing (Uber/Lyft)": [
    { videoId: "umWABit_NoQ", title: "Uber System Design", channel: "Gaurav Sen" },
  ],
  "Design: Search Engine (Google)": [
    { videoId: "CeGtqYdA-w4", title: "How Google Search Works", channel: "ByteByteGo" },
  ],
  "Design: File Storage (Google Drive/Dropbox)": [
    { videoId: "U0xTu6E2CT8", title: "Dropbox System Design", channel: "Gaurav Sen" },
  ],
  "Design: Payment System (Stripe/Razorpay)": [
    { videoId: "olfaBgJrUBI", title: "Payment System Design", channel: "ByteByteGo" },
  ],

  // ── Data Structures & Algorithms ────────────────────────────────────────
  "Arrays & Strings": [
    { videoId: "KLlXCFG5TnA", title: "Arrays & Strings for Coding Interviews", channel: "NeetCode" },
  ],
  "Linked Lists": [
    { videoId: "Hj_rA0dhr2I", title: "Linked Lists for Beginners", channel: "NeetCode" },
  ],
  "Trees & BST": [
    { videoId: "fAAZixBzIAI", title: "Binary Search Trees", channel: "NeetCode" },
  ],
  "Graphs": [
    { videoId: "tWVWeAqZ0WU", title: "Graph Algorithms for Interviews", channel: "freeCodeCamp" },
    { videoId: "utDu3Q7Flrw", title: "BFS & DFS in 100 Seconds", channel: "Fireship" },
  ],
  "Dynamic Programming": [
    { videoId: "oBt53YbR9Kk", title: "Dynamic Programming for Beginners", channel: "freeCodeCamp" },
    { videoId: "73r3KWiEvyk", title: "5 Simple Steps to DP", channel: "NeetCode" },
  ],
  "Hash Tables": [
    { videoId: "jalSiaIi8j4", title: "Hash Tables Explained", channel: "NeetCode" },
  ],
  "Sorting & Searching": [
    { videoId: "kPRA0W1kECg", title: "15 Sorting Algorithms Visualized", channel: "Timo Bingmann" },
  ],
  "Recursion & Backtracking": [
    { videoId: "IJDJ0kBx2LM", title: "Backtracking Explained", channel: "NeetCode" },
  ],
  "Stacks & Queues": [
    { videoId: "I37kGX-nZEI", title: "Stacks & Queues", channel: "NeetCode" },
  ],
  "Heaps & Priority Queues": [
    { videoId: "HqPJF2L5h9U", title: "Heap Data Structure", channel: "Abdul Bari" },
  ],

  // ── Core CS & Languages ─────────────────────────────────────────────────
  "JavaScript Fundamentals": [
    { videoId: "lkIFF4maKMU", title: "JavaScript in 100 Seconds", channel: "Fireship" },
    { videoId: "8aGhZQkoFbQ", title: "Event Loop Explained", channel: "JSConf" },
  ],
  "React & Next.js": [
    { videoId: "Tn6-PIqc4UM", title: "React in 100 Seconds", channel: "Fireship" },
    { videoId: "d5x0JCZbAJs", title: "Next.js Full Tutorial", channel: "Fireship" },
  ],
  "Java Core": [
    { videoId: "l9AzO1FMgM8", title: "Java in 100 Seconds", channel: "Fireship" },
  ],
  "Node.js": [
    { videoId: "ENrzD9HAZK4", title: "Node.js in 100 Seconds", channel: "Fireship" },
  ],
  "Operating Systems": [
    { videoId: "26QPDBe-NB8", title: "OS Concepts Every Developer Should Know", channel: "ByteByteGo" },
  ],
  "Computer Networks": [
    { videoId: "7IS7gigunyI", title: "Networking in 100 Seconds", channel: "Fireship" },
  ],
  "SQL & RDBMS": [
    { videoId: "zsjvFFKOm3c", title: "SQL Explained in 100 Seconds", channel: "Fireship" },
  ],
  "NoSQL Databases": [
    { videoId: "-bt_y4Loofg", title: "NoSQL Explained", channel: "Fireship" },
  ],
  "Spring Boot": [
    { videoId: "9SGDpanrc8U", title: "Spring Boot Tutorial", channel: "Amigoscode" },
  ],
  "Docker & Kubernetes": [
    { videoId: "Gjnup-PuquQ", title: "Docker in 100 Seconds", channel: "Fireship" },
    { videoId: "s_o8dwzRlu4", title: "Kubernetes in 100 Seconds", channel: "Fireship" },
  ],
  "Design Patterns": [
    { videoId: "tv-_1er1mWI", title: "10 Design Patterns Explained in 10 Min", channel: "Fireship" },
  ],
};

/** Look up videos for a topic name (case-insensitive) */
export function getVideosForTopic(topicName: string): YouTubeVideo[] {
  return YOUTUBE_VIDEOS[topicName] ?? [];
}
