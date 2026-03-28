# Reddit Posts — Ready to Post

Guidelines:
- Reddit hates blatant self-promotion. Every post must provide standalone value.
- The link to guru-sishya.in should feel like a helpful resource, not the point of the post.
- Engage with comments. Don't drop and disappear.
- Post from an account with existing karma (contribute to subreddits first for 2-3 weeks before posting).
- Best posting times for Indian subreddits: 9-11 AM IST weekdays. For US subreddits: 9-11 AM EST.

---

## Post 1: r/developersIndia

**Title**: I built a free interview prep tool after watching friends struggle with paid platforms

**Body**:

Hey everyone,

I've been a software dev for a few years and I kept seeing the same pattern — friends spending Rs. 2,000-5,000/month on interview prep subscriptions (LeetCode Premium, AlgoExpert, etc.), and still feeling unprepared because:

1. Those platforms focus heavily on DSA but ignore system design
2. Behavioral interview prep is almost nonexistent
3. There's no structured study plan — just a wall of problems
4. Code examples are mostly in C++ or Python, not Java (which most Indian companies care about)

So over the past several months, I built a platform that tries to address all of this. It's called Guru-Sishya and it's at guru-sishya.in.

What it covers:
- 138 topics (DSA, system design, Java/Spring Boot, React, design patterns, SQL, DevOps)
- 1,900+ quiz questions with detailed explanations
- 671 study sessions with code in both Java and Python
- STAR framework prep for behavioral rounds
- Cheatsheets for quick revision
- An integrated code playground (JS, Python, Java, C/C++)

The core platform is completely free. No login wall, no trial that expires.

I know there are a lot of resources out there already, so genuine question — what would make something like this actually useful for your preparation? What's missing from existing tools?

Would love honest feedback. Roast it if needed.

**Flair**: Career / Interview

---

## Post 2: r/cscareerquestions

**Context**: This is formatted as a helpful comment to drop on threads asking "How do I prepare for system design interviews?" or "What resources for system design?" — not a standalone post.

**Comment template (for relevant threads)**:

System design prep is really about building a mental framework, not memorizing designs. Here's the approach that worked for me and several friends:

**Weeks 1-2: Learn the building blocks**
- Load balancers, CDNs, reverse proxies
- SQL vs NoSQL (when to use which — this alone is an interview question)
- Caching patterns: cache-aside, write-through, write-behind
- Message queues: Kafka vs RabbitMQ vs SQS
- CAP theorem (but actually understand it, don't just recite it)

**Weeks 3-4: Practice 8-10 classic designs**
These come up repeatedly:
1. URL shortener (TinyURL)
2. Chat system (WhatsApp)
3. News feed (Twitter)
4. Rate limiter
5. Notification system
6. Search autocomplete
7. Video streaming (Netflix)
8. Distributed cache (Redis design)

For each one, spend 45 minutes. Write requirements, draw the design, identify tradeoffs.

**Weeks 5-6: Mock interviews**
The #1 differentiator. System design is about communication, not just architecture. Practice explaining your design out loud.

**Resources that helped me**:
- "Designing Data-Intensive Applications" by Kleppmann (the DDIA bible)
- Alex Xu's System Design Interview books
- ByteByteGo YouTube channel
- guru-sishya.in has free structured sessions with Mermaid diagrams for each of these topics — nice if you want a guided path rather than piecing together blog posts

The most important thing: don't just read about system design. Draw it. Explain it to someone. The interview is a conversation, not a test.

---

## Post 3: r/learnprogramming

**Title**: Complete system design roadmap for self-taught developers (no CS degree needed)

**Body**:

I see a lot of questions here from self-taught developers who feel confident about coding but anxious about system design interviews. I was in the same boat a few years ago, so here's the roadmap I wish I had.

**The honest truth**: System design isn't as mysterious as it seems. It's really about knowing ~15 building blocks and understanding when to use each one.

### Phase 1: Foundations (2 weeks)

**Networking basics** (you need just enough):
- HTTP/HTTPS, TCP/UDP
- DNS resolution
- REST vs GraphQL vs gRPC

**Storage**:
- Relational databases (PostgreSQL): ACID, indexing, normalization
- NoSQL databases: Document (MongoDB), Key-Value (Redis), Column (Cassandra)
- When to use which (this is THE most asked question)

**Compute**:
- Horizontal vs vertical scaling
- Stateless services (and why they matter)
- Containers and orchestration (Docker, Kubernetes basics)

### Phase 2: Distributed Systems Concepts (2 weeks)

- CAP theorem and what it actually means in practice
- Consistency models: strong, eventual, causal
- Partitioning/sharding strategies
- Replication: leader-follower, multi-leader, leaderless
- Consensus algorithms (Raft — understand the idea, don't memorize the protocol)

### Phase 3: Infrastructure Patterns (1 week)

- Load balancing: Round-robin, least connections, consistent hashing
- Caching: CDN, application cache, database cache
- Message queues: Pub/sub, point-to-point, exactly-once delivery
- API Gateway pattern
- Circuit breaker pattern

### Phase 4: Practice Designs (2-3 weeks)

Work through these classic problems:
1. URL Shortener — teaches hashing, database design, caching
2. Twitter Feed — teaches fan-out, cache layers, ranking
3. WhatsApp — teaches WebSockets, message queuing, encryption
4. Uber — teaches geospatial indexing, real-time matching
5. YouTube — teaches CDN, transcoding, recommendation
6. Dropbox — teaches file sync, deduplication, conflict resolution

For each design, ask yourself:
- What are the functional requirements?
- What are the non-functional requirements? (latency, availability, consistency)
- What's the database schema?
- How does it handle failure?
- What happens at 10x scale?

### Phase 5: Interview Simulation (1 week)

- Practice with a friend (take turns as interviewer/candidate)
- Set a 45-minute timer per question
- Focus on communication: explain your reasoning out loud

### Resources

**Books**:
- "Designing Data-Intensive Applications" — the single best resource
- "System Design Interview" by Alex Xu — great for structured practice

**Free resources**:
- guru-sishya.in — has structured sessions for system design fundamentals + case studies with architecture diagrams. Full disclosure: I built this, but the content is genuinely free and covers all the topics above
- MIT 6.824 Distributed Systems lectures (on YouTube)
- Netflix/Uber/Stripe engineering blogs for real-world architecture

**You don't need a CS degree for system design.** You need to understand the building blocks, practice combining them, and be able to explain your thinking clearly. That's it.

Good luck. Feel free to ask questions in the comments.

---

## Post 4: r/leetcode

**Title**: Sharing a free resource with 1,900+ practice questions (DSA + system design + behavioral)

**Body**:

I've been lurking here for a while and I know the community values free, quality resources. I built something that might be useful for some of you, especially those who want more than just DSA practice.

**What it is**: guru-sishya.in — a free interview prep platform.

**What it has**:
- 1,933 quiz questions across DSA, system design, Java, JavaScript, React, SQL, design patterns, and more
- Each question has a detailed explanation (not just "the answer is B")
- 671 structured study sessions with code in Java + Python
- Cheatsheets for quick revision before interviews
- A code playground where you can run solutions (JS, Python, Java, C, C++)

**What it's NOT**:
- It's not a LeetCode replacement for competitive programming. There's no online judge for submitting solutions to specific problems.
- It's not a course — there are no videos.
- It's not trying to be everything — it's focused on interview preparation.

**Why I'm sharing**: I genuinely built this because I was frustrated that comprehensive interview prep required 3-4 different subscriptions. This tries to be the one-stop resource.

No login required for core features. No "free trial." The quiz questions, study sessions, and cheatsheets are permanently free.

If you try it, I'd appreciate honest feedback — what's useful, what's missing, what could be better. I'm actively adding content.

**Flair**: Resource / Tool

---

## Post 5: r/IndianDevelopers (or r/Indian_Academia)

**Title**: Placement season prep: free resource covering DSA, system design, and behavioral rounds for Indian companies

**Body**:

Placement season is here (or coming soon for many of you), and I wanted to share a free resource I built that's specifically designed for the Indian interview landscape.

**Why "for India"?**

Most interview prep platforms are designed for US/Silicon Valley interviews. Indian companies — especially service-based ones transitioning to product, and the Indian offices of FAANG — have some specific patterns:

1. **Java is king**: Most Indian companies (TCS, Infosys product teams, Flipkart, Razorpay, etc.) prefer Java. Not C++ or Python.
2. **Spring Boot comes up a lot**: Senior developer roles in India almost always ask about Spring Boot, microservices, and Hibernate.
3. **STAR behavioral rounds are becoming standard**: Companies like Amazon India, Google Hyderabad, and Microsoft Noida all use structured behavioral interviews.
4. **System design is no longer just for seniors**: Even 2-3 YOE roles at product companies now include a system design round.

**The resource**: guru-sishya.in

It covers:
- **138 topics** across DSA, system design, Java core, Spring Boot, React, JavaScript, SQL, NoSQL, design patterns, Kubernetes, Kafka, and more
- **All code examples in Java AND Python**
- **1,900+ quiz questions** with detailed explanations
- **52 cheatsheets** for last-minute revision
- **STAR behavioral prep** with 50+ questions
- **System design case studies** (Design WhatsApp, Design Flipkart, etc.) with architecture diagrams

**Completely free** — no login, no trial, no hidden paywall for essential features.

I built this while preparing for my own interviews and kept adding content based on what actual Indian companies ask. If you're preparing for placements — whether campus or off-campus — feel free to use it.

Happy to answer questions about interview prep in the comments. I've been through the process at a few companies and can share what actually gets asked vs. what you see in generic "interview tips" articles.

---

## General Tips for Reddit Engagement

1. **Never post all 5 on the same day.** Space them out over 2-3 weeks.
2. **Reply to every comment** in the first 24 hours. Reddit's algorithm rewards engagement.
3. **Be genuinely helpful** in comments. Answer follow-up questions about interview prep, not just about the platform.
4. **Accept criticism gracefully.** If someone says "there are already 100 platforms like this," acknowledge it and explain what's different.
5. **Cross-post carefully.** Don't copy-paste the same content across subreddits — Reddit users check post history.
6. **Upvote and engage with other posts** in these subreddits for 2-3 weeks before your own post. Fresh accounts posting links get flagged as spam.
