#!/usr/bin/env node
/**
 * Add more quiz questions to topic files that have fewer than 20.
 * Generates topic-relevant MCQ questions with explanations.
 */
const fs = require('fs');
const path = require('path');
const CONTENT_DIR = path.join(__dirname, '..', 'public', 'content');

// Quiz question templates by topic
const QUESTION_BANKS = {
  'Java Core': [
    { question: "What is the difference between == and .equals() in Java?", options: ["A) == compares values, .equals() compares references", "B) == compares references, .equals() compares content", "C) They are identical", "D) == only works with primitives"], correctAnswer: "B", explanation: "== compares object references (memory addresses) while .equals() compares the actual content/values. For primitives, == compares values directly.", difficulty: 3, format: "mcq" },
    { question: "What happens when you call HashMap.put() with an existing key?", options: ["A) It throws an exception", "B) It creates a duplicate entry", "C) It replaces the old value and returns it", "D) It ignores the new value"], correctAnswer: "C", explanation: "HashMap.put() replaces the value for an existing key and returns the old value. The key remains unchanged.", difficulty: 3, format: "mcq" },
    { question: "Which collection should you use for thread-safe key-value operations?", options: ["A) HashMap", "B) Hashtable", "C) ConcurrentHashMap", "D) LinkedHashMap"], correctAnswer: "C", explanation: "ConcurrentHashMap uses segment-level locking for better concurrency than Hashtable (which locks the entire map). HashMap is not thread-safe at all.", difficulty: 4, format: "mcq" },
    { question: "What is the purpose of the volatile keyword in Java?", options: ["A) Makes a variable immutable", "B) Ensures visibility across threads — reads always see the latest write", "C) Prevents garbage collection", "D) Locks the variable for exclusive access"], correctAnswer: "B", explanation: "volatile ensures that reads and writes to a variable are visible to all threads. It prevents thread-local caching but does NOT provide atomicity for compound operations.", difficulty: 4, format: "mcq" },
    { question: "What is the time complexity of ArrayList.add(0, element)?", options: ["A) O(1)", "B) O(log n)", "C) O(n)", "D) O(n²)"], correctAnswer: "C", explanation: "Adding at index 0 requires shifting all existing elements right by one position, which takes O(n) time. Use LinkedList.addFirst() for O(1) head insertion.", difficulty: 3, format: "mcq" },
    { question: "What does the final keyword mean when applied to a method?", options: ["A) The method cannot be called", "B) The method cannot be overridden by subclasses", "C) The method runs only once", "D) The method is static"], correctAnswer: "B", explanation: "A final method cannot be overridden by subclasses. This is useful for security-critical methods or when you want to prevent changing behavior in inheritance.", difficulty: 2, format: "mcq" },
    { question: "Which Java feature allows you to process collections with functional-style operations?", options: ["A) Iterators", "B) Streams API", "C) Generics", "D) Reflection"], correctAnswer: "B", explanation: "The Streams API (java.util.stream) enables functional-style operations like map, filter, reduce on collections. Introduced in Java 8.", difficulty: 2, format: "mcq" },
    { question: "What is the difference between checked and unchecked exceptions?", options: ["A) Checked exceptions are faster", "B) Checked must be caught or declared; unchecked don't need to be", "C) Unchecked exceptions crash the JVM", "D) There is no difference"], correctAnswer: "B", explanation: "Checked exceptions (extends Exception) must be caught or declared in throws. Unchecked exceptions (extends RuntimeException) don't require explicit handling. Examples: IOException (checked), NullPointerException (unchecked).", difficulty: 3, format: "mcq" },
    { question: "What is the output of: System.out.println(10 + 20 + \"Hello\" + 10 + 20)?", options: ["A) 1020Hello1020", "B) 30Hello1020", "C) 30Hello30", "D) 60Hello"], correctAnswer: "B", explanation: "Java evaluates left-to-right. 10+20=30 (integer addition), then 30+\"Hello\"=\"30Hello\" (string concatenation), then \"30Hello\"+10=\"30Hello10\", then +20=\"30Hello1020\".", difficulty: 3, format: "mcq" },
    { question: "What is the purpose of the transient keyword?", options: ["A) Makes a field thread-safe", "B) Excludes a field from serialization", "C) Makes a field constant", "D) Allows null values"], correctAnswer: "B", explanation: "The transient keyword prevents a field from being serialized when using ObjectOutputStream. Useful for sensitive data (passwords) or derived/cached values.", difficulty: 4, format: "mcq" },
  ],
  'JavaScript & TypeScript': [
    { question: "What is the output of: typeof null?", options: ["A) 'null'", "B) 'undefined'", "C) 'object'", "D) 'NaN'"], correctAnswer: "C", explanation: "typeof null returns 'object' due to a legacy bug in JavaScript's original implementation. This has never been fixed for backward compatibility.", difficulty: 2, format: "mcq" },
    { question: "What is closure in JavaScript?", options: ["A) A way to close browser tabs", "B) A function that has access to its outer scope even after the outer function returns", "C) A method to end loops", "D) A type of error handling"], correctAnswer: "B", explanation: "A closure is created when a function 'remembers' variables from its enclosing scope. This enables data privacy, function factories, and the module pattern.", difficulty: 3, format: "mcq" },
    { question: "What is the event loop in Node.js?", options: ["A) A for loop that runs events", "B) A mechanism that handles async operations by queuing callbacks", "C) A UI rendering engine", "D) A database query optimizer"], correctAnswer: "B", explanation: "The event loop is the core of Node.js async model. It processes callbacks from the task queue when the call stack is empty, enabling non-blocking I/O.", difficulty: 3, format: "mcq" },
    { question: "What is the difference between let, const, and var?", options: ["A) No difference", "B) var is function-scoped; let/const are block-scoped", "C) let is faster than var", "D) const allows reassignment"], correctAnswer: "B", explanation: "var is function-scoped and hoisted. let and const are block-scoped. const prevents reassignment (but objects/arrays can still be mutated). Always prefer const, then let.", difficulty: 2, format: "mcq" },
    { question: "What does Promise.all() do?", options: ["A) Runs promises sequentially", "B) Runs promises in parallel and resolves when ALL resolve", "C) Returns the fastest promise", "D) Cancels all promises"], correctAnswer: "B", explanation: "Promise.all() takes an array of promises, runs them concurrently, and resolves with an array of results when ALL complete. If ANY rejects, the entire Promise.all rejects.", difficulty: 3, format: "mcq" },
    { question: "What is the purpose of TypeScript's 'unknown' type?", options: ["A) Same as 'any'", "B) Type-safe alternative to 'any' that requires type checking before use", "C) Represents null values", "D) Used for error handling"], correctAnswer: "B", explanation: "unknown is the type-safe counterpart of any. You must narrow the type (typeof, instanceof, type guard) before performing operations on an unknown value.", difficulty: 4, format: "mcq" },
    { question: "What is the difference between map() and forEach()?", options: ["A) They are identical", "B) map() returns a new array; forEach() returns undefined", "C) forEach() is faster", "D) map() modifies the original array"], correctAnswer: "B", explanation: "map() transforms each element and returns a NEW array. forEach() iterates for side effects and returns undefined. Use map() for transformations, forEach() for actions.", difficulty: 2, format: "mcq" },
    { question: "What is debouncing?", options: ["A) Running a function immediately", "B) Delaying function execution until a pause in events", "C) Running a function twice", "D) Canceling all events"], correctAnswer: "B", explanation: "Debouncing delays function execution until there's a pause in rapid events (e.g., typing in a search box). Only the last call in a burst executes after the delay.", difficulty: 3, format: "mcq" },
    { question: "What does Object.freeze() do?", options: ["A) Prevents new properties from being added", "B) Makes an object completely immutable (no add, delete, or modify)", "C) Freezes the garbage collector", "D) Locks the prototype chain"], correctAnswer: "B", explanation: "Object.freeze() makes an object immutable — you can't add, remove, or change properties. It's shallow though — nested objects can still be modified.", difficulty: 3, format: "mcq" },
    { question: "What is tree-shaking?", options: ["A) A sorting algorithm", "B) Removing unused code from the final bundle during build", "C) A CSS technique", "D) Database optimization"], correctAnswer: "B", explanation: "Tree-shaking is a dead code elimination technique used by bundlers (webpack, Rollup) to remove unused exports from the final JavaScript bundle, reducing file size.", difficulty: 3, format: "mcq" },
  ],
  'Apache Kafka': [
    { question: "What is a Kafka partition?", options: ["A) A backup of the topic", "B) An ordered, immutable sequence of messages within a topic", "C) A consumer group", "D) A broker configuration"], correctAnswer: "B", explanation: "A partition is an ordered, append-only log within a topic. Messages within a partition have sequential offsets. Partitions enable parallelism — different consumers can read different partitions.", difficulty: 2, format: "mcq" },
    { question: "What guarantees does Kafka provide for message ordering?", options: ["A) Global ordering across all partitions", "B) Ordering within a single partition only", "C) No ordering guarantee", "D) Ordering within a consumer group"], correctAnswer: "B", explanation: "Kafka guarantees ordering ONLY within a single partition. To ensure order for related messages, use the same partition key (e.g., user_id).", difficulty: 3, format: "mcq" },
    { question: "What is a consumer group in Kafka?", options: ["A) A set of topics", "B) A set of consumers that cooperatively read from topic partitions", "C) A cluster of brokers", "D) A type of message format"], correctAnswer: "B", explanation: "A consumer group is a set of consumers that divide partition ownership among themselves. Each partition is consumed by exactly one consumer in the group, enabling parallel processing.", difficulty: 3, format: "mcq" },
    { question: "What happens when a Kafka consumer crashes?", options: ["A) Messages are lost", "B) The partition is reassigned to another consumer in the group (rebalancing)", "C) The topic is deleted", "D) All consumers stop"], correctAnswer: "B", explanation: "When a consumer crashes, Kafka triggers a rebalance — the partition is reassigned to another consumer in the same group. Messages are replayed from the last committed offset.", difficulty: 3, format: "mcq" },
    { question: "What is the difference between acks=0, acks=1, and acks=all?", options: ["A) They control message size", "B) They control durability — how many replicas must acknowledge a write", "C) They control consumer speed", "D) They control partition count"], correctAnswer: "B", explanation: "acks=0: no acknowledgment (fastest, least durable). acks=1: leader acknowledges (good balance). acks=all: all in-sync replicas acknowledge (safest, slowest).", difficulty: 4, format: "mcq" },
    { question: "What is Kafka's retention policy?", options: ["A) Messages are deleted after consumption", "B) Messages are retained for a configurable time or size, regardless of consumption", "C) Messages are never deleted", "D) Messages are deleted after 1 hour"], correctAnswer: "B", explanation: "Kafka retains messages based on time (retention.ms, default 7 days) or size (retention.bytes). Messages persist whether consumed or not — multiple consumers can read independently.", difficulty: 3, format: "mcq" },
    { question: "What is the role of ZooKeeper in Kafka?", options: ["A) Message storage", "B) Metadata management, broker coordination, and leader election", "C) Message compression", "D) Consumer load balancing"], correctAnswer: "B", explanation: "ZooKeeper manages cluster metadata, broker registration, partition leader election, and configuration. Note: KRaft mode (Kafka 3.3+) removes the ZooKeeper dependency.", difficulty: 3, format: "mcq" },
    { question: "How does Kafka achieve high throughput?", options: ["A) In-memory only storage", "B) Sequential I/O, batching, compression, zero-copy transfers, and partitioning", "C) Using multiple databases", "D) Caching all messages"], correctAnswer: "B", explanation: "Kafka's high throughput comes from: sequential disk I/O (faster than random), message batching, compression, zero-copy via sendfile(), and horizontal scaling via partitions.", difficulty: 4, format: "mcq" },
    { question: "What is a dead letter queue (DLQ) in Kafka?", options: ["A) A queue for deleted messages", "B) A separate topic for messages that failed processing after retries", "C) A backup broker", "D) A consumer configuration"], correctAnswer: "B", explanation: "A DLQ is a separate topic where messages that fail processing (after max retries) are sent for later investigation. This prevents poison messages from blocking the main consumer.", difficulty: 3, format: "mcq" },
    { question: "What is exactly-once semantics in Kafka?", options: ["A) Each message is processed exactly once with no duplicates", "B) Each message is sent once", "C) Each consumer reads once", "D) Not possible in Kafka"], correctAnswer: "A", explanation: "Exactly-once semantics (EOS) ensures each message is processed exactly once, even with failures. Achieved via idempotent producers (enable.idempotence=true) and transactional API.", difficulty: 5, format: "mcq" },
  ],
};

// Generic questions for topics without specific banks
function generateGenericQuestions(topicName, count) {
  const questions = [];
  const templates = [
    { q: `What is the primary advantage of ${topicName}?`, opts: ["A) Speed", "B) Scalability", "C) Simplicity", "D) All of the above, depending on context"], ans: "D", exp: `${topicName} offers different advantages depending on the use case. In interviews, always discuss trade-offs rather than absolving advantages.` },
    { q: `When should you NOT use ${topicName}?`, opts: ["A) When requirements are simple", "B) When the team is small", "C) When the overhead exceeds the benefit", "D) Never — always use it"], ans: "C", exp: `Every technology has trade-offs. ${topicName} adds complexity that may not be justified for simple use cases. Always evaluate if the overhead is worth the benefit.` },
    { q: `What is the time complexity of the core operation in ${topicName}?`, opts: ["A) O(1)", "B) O(log n)", "C) O(n)", "D) It depends on the implementation"], ans: "D", exp: `The time complexity depends on the specific implementation and operation. In interviews, always clarify which operation before stating complexity.` },
    { q: `How does ${topicName} handle failures?`, opts: ["A) Retry with exponential backoff", "B) Circuit breaker pattern", "C) Graceful degradation", "D) Strategy depends on the system requirements"], ans: "D", exp: `Failure handling in ${topicName} depends on requirements: retry for transient failures, circuit breaker for cascading failures, graceful degradation for user-facing systems.` },
    { q: `Which company popularized the use of ${topicName}?`, opts: ["A) Google", "B) Amazon", "C) Netflix", "D) Multiple companies contributed"], ans: "D", exp: `${topicName} evolved through contributions from multiple companies. In interviews, mentioning real-world examples from different companies shows breadth of knowledge.` },
  ];

  for (let i = 0; i < Math.min(count, templates.length); i++) {
    const t = templates[i];
    questions.push({
      question: t.q,
      options: t.opts,
      correctAnswer: t.ans,
      explanation: t.exp,
      difficulty: 3,
      format: "mcq",
    });
  }
  return questions;
}

// Process all files
const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'));
let totalAdded = 0;

for (const f of files) {
  const filePath = path.join(CONTENT_DIR, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const topics = Array.isArray(data) ? data : [data];
  let fileAdded = 0;

  topics.forEach(t => {
    if (!t.topic) return;
    if (!t.quizBank) t.quizBank = [];

    const currentCount = t.quizBank.length;
    if (currentCount >= 20) return; // Already has enough

    const needed = 20 - currentCount;

    // Check if we have specific questions for this topic
    const specificBank = QUESTION_BANKS[t.topic];
    if (specificBank) {
      const toAdd = specificBank.slice(0, needed);
      // Avoid duplicates
      const existingQuestions = new Set(t.quizBank.map(q => q.question?.substring(0, 50)));
      for (const q of toAdd) {
        if (!existingQuestions.has(q.question.substring(0, 50))) {
          t.quizBank.push(q);
          fileAdded++;
        }
      }
    } else {
      // Add generic questions
      const generics = generateGenericQuestions(t.topic, needed);
      t.quizBank.push(...generics);
      fileAdded += generics.length;
    }
  });

  if (fileAdded > 0) {
    fs.writeFileSync(filePath, JSON.stringify(Array.isArray(data) ? topics : topics[0]));
    console.log(f + ': added ' + fileAdded + ' quiz questions');
    totalAdded += fileAdded;
  }
}

console.log('\nTotal: added ' + totalAdded + ' quiz questions');
