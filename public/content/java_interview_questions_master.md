# Java Backend Interview Questions — Master Collection

---

## IMAGE 1: Top 30 Most-Asked Interview Questions (5+ Years Java Backend Developer)

### Core Java (Basics decide rejection fast)
1. What happens if you override equals() but not hashCode()? Explain the real production impact.
2. Explain HashMap internal working in Java 8+.
3. When does HashMap convert a bucket into a tree? Mention exact conditions.
4. Why is String immutable in Java? Explain security and performance reasons.
5. Comparable vs Comparator — how do you handle multiple sorting logics?

### Java 8 / Stream API (Experience check)
6. Difference between map() and flatMap() with a real project example.
7. findFirst() vs findAny() — behavior in parallel streams.
8. Streams vs for-loop — when do streams perform worse?
9. Explain groupingBy() with downstream collectors.
10. Why should Optional not be used as a class field?

### Spring / Spring Boot (Resume vs reality)
11. @Component vs @Service vs @Repository — real difference or just naming?
12. Explain Spring Bean lifecycle step by step.
13. @Transactional — REQUIRED vs REQUIRES_NEW with real use case.
14. How do you design global exception handling in REST APIs?
15. Explain Spring Boot startup flow and the role of AutoConfiguration.

### Microservices (System-level thinking)
16. Synchronous vs Asynchronous communication — when is REST a bad choice?
17. What problem does a Circuit Breaker solve? (No theory)
18. What is idempotency? Explain with a payment system example.
19. How do you change configuration without restarting microservices?
20. API versioning strategies in microservices.

### Database / JPA (Most candidates fail here)
21. What is the N+1 problem? How do you detect and fix it?
22. Lazy vs Eager fetching — impact of wrong choice.
23. When does a database index NOT get used?
24. Optimistic vs Pessimistic locking — when to use which?
25. How do you handle pagination for very large tables?

### System Design / Production
26. Design a wallet transfer system — how do you ensure data consistency?
27. How do you scale a high-traffic API?
28. When is caching harmful?
29. How do you implement rate limiting?
30. A production issue occurs — what are your first 30 minutes of action?

---

## IMAGE 2: Real, Most-Asked, Advanced Java Interview Questions (Depth, not memory)

1. Why does a Java app behave differently in prod vs local JVM?
2. How does JVM decide object allocation under heavy load?
3. What exactly happens during a Stop-The-World pause?
4. Why is volatile not enough for thread safety?
5. When does synchronized become a bottleneck?
6. How can HashMap cause issues in concurrent environments?
7. Difference between ConcurrentHashMap and synchronized HashMap internally.
8. How does Java Memory Model ensure visibility?
9. What is false sharing and how do you avoid it?
10. Why does double-checked locking fail sometimes?
11. How does JVM detect deadlocks?
12. Why can a thread pool silently kill performance?
13. What happens if a Runnable throws an unchecked exception?
14. How do you safely shut down an ExecutorService?
15. Why does GC tuning improve latency but reduce throughput?
16. How does G1 GC decide which region to clean?
17. Why does OutOfMemoryError occur even with free heap?
18. How do you find memory leaks in a running JVM?
19. Difference between strong, weak, soft, and phantom references.
20. Why is finalize() dangerous and deprecated?
21. How does class loading work in large Java applications?
22. Why does ClassCastException occur even with correct code?
23. How does Java handle instruction reordering?
24. When does autoboxing hurt performance badly?
25. Why is String immutable and how does it help concurrency?
26. How does JVM optimize hot code paths?
27. What is escape analysis and why does it matter?
28. Why does a Java process not exit after main() ends?
29. How do you debug high CPU usage with low traffic?
30. What Java decision caused you a real production issue?

---

## IMAGE 3: Java Backend Interview — 50 Advanced Questions (Part 2)

1. What is difference between synchronous and asynchronous communication?
2. What is REST vs gRPC?
3. What is HTTP/2 and HTTP/3?
4. What is connection pooling and why is it needed?
5. How does HikariCP work internally?
6. What is thread pool and how to tune it?
7. What is ForkJoinPool?
8. How does garbage collection work in JVM?
9. What is G1 GC vs ZGC?
10. What is memory leak in Java?
11. What is OutOfMemoryError vs StackOverflowError?
12. What is classloader hierarchy?
13. What is Metaspace?
14. What is JIT compiler?
15. What is escape analysis?
16. What is CompletableFuture chaining?
17. What is reactive backpressure strategy?
18. What is event sourcing?
19. What is CQRS pattern?
20. What is database sharding?
21. What is read replica?
22. What is eventual vs strong consistency?
23. What is two-phase commit?
24. What is id generation strategy in JPA?
25. What is optimistic locking version column?
26. What is soft delete implementation?
27. How to design audit logging?
28. What is API rate limiting with Redis?
29. What is token bucket vs leaky bucket?
30. What is distributed cache coherence?
31. What is Hazelcast?
32. What is message ordering in Kafka?
33. What is Kafka partition rebalance?
34. What is dead letter queue?
35. What is retry with exponential backoff?
36. What is timeout vs circuit breaker?
37. What is graceful degradation?
38. What is fallback mechanism?
39. What is health check readiness vs liveness?
40. What is blue-green vs rolling deployment?
41. What is sidecar pattern?
42. What is service discovery?
43. What is API throttling?
44. What is zero trust security?
45. What is mTLS?
46. What is secrets management?
47. What is config hot reload?
48. What is feature toggle?
49. What is chaos engineering?
50. How do you design fault-tolerant microservices?

---

## IMAGE 4: Spring Boot Debugging & Production Questions (30 Questions)

1. Why does a Spring Boot app consume more memory over time?
2. How do you detect bean initialization issues in large applications?
3. What happens if @PostConstruct throws an exception?
4. Why does @Value sometimes fail to inject properties?
5. How does Spring Boot decide the order of auto-configurations?
6. What are the risks of enabling too many Actuator endpoints?
7. Why does your app behave differently after scaling pods?
8. How does Spring Boot handle classpath scanning internally?
9. What causes duplicate bean registration in multi-module projects?
10. Why does your API return correct data but response time fluctuates?
11. How do you control thread usage in Spring Boot applications?
12. What happens when application.yml and application.properties both exist?
13. Why do custom exception handlers sometimes not trigger?
14. How do you handle large payloads without killing performance?
15. Why does Hibernate generate unexpected queries?
16. How do you debug a deadlock in a Spring Boot service?
17. What happens if a BeanFactoryPostProcessor fails?
18. How do you avoid startup failure due to missing configs?
19. Why does Spring Boot retry DB connections on startup?
20. How do you manage feature toggles safely?
21. Why does @Cacheable sometimes not cache?
22. How does Spring Boot isolate environment-specific configs?
23. What causes classloader issues in fat JARs?
24. How do you safely reload configs without restarting?
25. Why does logging behave differently in prod vs local?
26. How do you handle partial failures in dependent services?
27. What is the real impact of using too many interceptors?
28. How do you prevent breaking changes during deployments?
29. Why does @ConfigurationProperties fail silently?
30. What Spring Boot decision caused you a real production issue?

---

## IMAGE 5: Core Java Concurrency & Internals (10 Questions)

1. What is the difference between synchronized and ReentrantLock?
2. Explain the purpose of volatile keyword in multithreading.
3. How does ThreadLocal work internally?
4. What is the difference between fail-fast and fail-safe iterators?
5. Explain the diamond problem in Java 8 and how it's resolved.
6. What is PermGen vs Metaspace?
7. How does G1GC differ from CMS garbage collector?
8. What is a functional interface and how does it enable lambda expressions?
9. Explain effectively final variables in the context of lambdas.
10. How would you detect and fix memory leaks in Java?

---

## IMAGE 6: 100 Java Interview Topics (Comprehensive List)

1. Explain JVM architecture.
2. Difference between JDK, JRE, and JVM.
3. How Garbage Collection works in Java?
4. Types of Garbage Collection.
5. What is a memory leak in Java?
6. String vs StringBuffer vs StringBuilder
7. How HashMaps works internally?
8. HashMap vs ConcurrentHashMap
9. Why String is immutable?
10. equals() vs hashCode()
11. What is Classloader?
12. Explain Reflection API
13. What is Autoboxing and Unboxing?
14. What are Soft, Weak, and Phantom references?
15. What is Autoboxing and Unboxing?
16. What is a volatile keyword?
17. Fail-Fast vs Fail-Safe iterators.
18. Functional Interfaces
19. Thread lifecycle
20. Types of Thread Pools
21. Deadlock and prevention.
22. Race condition.
23. Synchronization.
24. synchronized vs Lock.
25. CyclicBarrier
26. CountDownLatch
27. ForkJoinPool
28. AtomicInteger
29. Atomic variables.
30. Compare-And-Swap (CAS).
31. ThreadLocal.
32. BlockingQueue.
33. Producer-Consumer problem.
34. Designing high-performance multithreading.
35. Dependency Injection.
36. Spring Boot Annotations.
37. @Component vs @Service vs @Repository.
38. Constructor Injection vs Field Injection.
39. Proxy in Spring.
40. AOP in Spring.
41. REST vs SOAP.
42. Spring Boot AutoConfiguration.
43. Spring Security flow.
44. OAuth2.
45. Circuit Breaker pattern.
46. Service Discovery (Eureka).
47. API Gateway.
48. Feign Client.
49. Config Server.
50. Kafka architecture.
51. Kafka consumer.
52. Event Driven Architecture.
53. Saga Pattern.
54. Distributed Tracing.
55. Resilience4j.
56. Docker with Spring Boot.
57. Kubernetes deployment strategies.
58. Blue-Green deployment.
59. JIT Compiler.
60. Metaspace vs PermGen.
61. Heap Dump analysis.
62. GC tuning/tuning for troubleshooting.
63. GC tuning.
64. Stop-The-World events.
65. ClassLoader memory leak.
66. Escape Analysis.
67. Object Pooling.
68. JMX.
69. Memory Thrashing.
70. JVM Profiling tools.
71. CPU profiling.
72. Asynchronous processing.
73. Reactive Programming.
74. Singleton pattern (thread-safe).
75. Factory vs Abstract Factory.
76. Builder pattern.
77. Strategy pattern.
78. Observer pattern.
79. Proxy pattern.
80. Circuit Breaker pattern.
81. CQRS.
82. Event Sourcing.
83. SOLID principles.
84. Microservices vs Monolith.
85. CAP Theorem.
86. Idempotency in REST APIs.
87. Rate Limiting design.
88. XSS. Design a high-traffic REST API.

---

## IMAGE 7: Spring Boot Microservices (10 Questions)

1. What is the Circuit Breaker pattern and how is it implemented?
2. Explain the Saga pattern for distributed transactions.
3. How do you implement fault tolerance in Spring Boot microservices?
4. What is the difference between @RestController and @Controller?
5. Explain lazy initialization in Spring Boot and its impact on startup time.
6. How would you optimize Spring Boot application startup time?
7. What are the benefits of using Spring Cloud Gateway over Zuul?
8. Explain the purpose of Spring Boot Actuator metrics.
9. How do you implement distributed tracing using Spring Cloud Sleuth and Zipkin?
10. What is the difference between monolithic architecture, SOA, and microservices architecture?

---

## IMAGE 8: Java Core & Microservices (10 Questions)

1. What is the difference between Callable and Runnable?
2. Explain the Java Memory Model (JMM) and happens-before relationship.
3. Why should passwords be stored in char arrays instead of Strings?
4. How does compare-and-swap (CAS) work in concurrent programming?
5. What is the difference between String, StringBuilder, and StringBuffer?
6. Explain pattern matching enhancements in Java 23.
7. How do you handle distributed transactions in microservices?
8. What is the role of API Gateway in Spring Boot microservices?
9. Explain service discovery using Spring Cloud Netflix Eureka.
10. How does Spring Cloud Config Server manage externalized configuration?

---

## IMAGE 9: Java + Spring Boot Interview Coding & Practical Questions

1. How to implement payment gateway?
2. How to store customer sensitive data like account information in database?
3. What is @ComponentScan, what is the use of it?
4. We have a list of integers. Find out all the numbers starting with 1 using stream function. (a. 11, 18, 20, 24, 85, 66, 13)
5. We have a list of employees, in which we have id, name, age, gender and salary.
   - a. How many male and female employees are there in the organization.
   - b. Take out average salary based on employee gender.
6. Write a java program to find sum of even numbers and sum of odd numbers in a given list using java 8 streams.
7. How to find duplicate elements in a given integers list in java using Streams function.
8. I need to compare if two arrays are same, but the order does not matter, just compare the elements in arr1 to elements in arr2. (a. arr1 = [3, 2, 5, 7], b. arr2 = [2, 3, 5, 7])
9. I will provide a string, remove all the occurrences of a given character from that string.
10. Finding special character in the String, special characters are those characters which are not alphabets or not numbers.
11. Write a program to check if given strings are rotations of each other or not.
12. Write a program to Find the missing number from the array.
13. Write a program to convert first half of the String in lower case and second half in upper case.
14. Java 8 Program to get Highest paid Employee in Each department using stream API.
15. Write a java 8 program to find the words starting with vowels.
16. Write a java 8 program to print employees count working in each department.
17. Write a java 8 program to print active and inactive employees in the given collection.
18. Write a java 8 program to print employee details working in each department.
19. Write a java 8 program to print max salary of employee in each department max/min employee salary in given collection.
20. (Not numbered — skipped in source)
21. Write a Java 8 method to find the sum of all elements in a List of integers.

---

## IMAGE 10: Production Debugging & Scenario-Based Questions (30 Questions)

1. Your Java service is slow but CPU usage is low — what do you investigate first?
2. A thread pool is configured correctly, yet tasks are getting delayed. Why?
3. Your app throws OutOfMemoryError even though heap looks sufficient. How?
4. Production logs show no errors, but users face random failures. What could be wrong?
5. Multiple threads update shared data and results are inconsistent — how do you fix it?
6. A Java app works fine for hours, then suddenly slows down. What's your approach?
7. GC pauses are high after a new release. What changes might have caused this?
8. One API call blocks others even though threads are available. Why?
9. Your JVM doesn't exit even after main() completes. What's holding it?
10. High CPU usage with very low traffic — where do you look?
11. A deadlock happens rarely and can't be reproduced locally. How do you debug it?
12. HashMap size increases but lookups become slower. What went wrong?
13. A background job impacts API response time. How do you isolate it?
14. ThreadLocal fixed one bug but created another. What's the risk?
15. After scaling instances, performance gets worse. Why?
16. A task submitted to ExecutorService fails silently. What happened?
17. You see frequent Full GCs after a config change. Why?
18. Memory usage keeps growing but no references are obvious. What do you suspect?
19. An API is fast sometimes and slow at other times. What could cause this?
20. Application behaves differently between Java 8 and Java 17. Why?
21. Logging was increased for debugging and prod went down. How?
22. A fix works locally but fails under concurrency. What was missed?
23. Threads are waiting but no deadlock is detected. What's happening?
24. A cache improves performance initially, then degrades it. Why?
25. After enabling parallel streams, response time increased. Why?
26. JVM tuning helped latency but hurt throughput. Explain the trade-off.
27. A small code change caused massive GC pressure. How?
28. A retry mechanism caused system overload. What design mistake?
29. App crashes only during peak hours. What patterns do you look for?
30. What Java decision you made once caused a real production issue?

---

## IMAGE 11: Java Multithreading Deep Dive — Topics & Scenarios (LinkedIn Post, Part 2)

### Locks and Synchronization (this shows seniority)
- synchronized vs ReentrantLock and why both still matter
- Intrinsic locks vs explicit locks and when fairness is important
- How ReadWriteLock improves throughput and when it can backfire
- How deadlocks happen in production, not just in theory

### Thread Pools and Executors (where most real bugs live)
- Choosing between fixed, cached, and work-stealing thread pools
- Sizing thread pools for CPU-bound vs IO-bound workloads
- What really happens when executor queues fill up
- When CompletableFuture improves clarity and when it hides complexity

### Concurrent Collections (easy to misuse)
- Why ConcurrentHashMap scales better than synchronized collections
- What happens internally when multiple threads update the same map
- When CopyOnWriteArrayList is a good idea and when it's a terrible one

### Real-World Scenarios Interviewers Love
- Making a service thread-safe without destroying throughput
- Handling shared mutable state in high-traffic microservices
- Debugging race conditions that only appear in production

---

## IMAGE 12: Java Multithreading Interview Guide (LinkedIn Post, Full)

### Core Concepts (where many people stumble)
- When would you use Thread vs Runnable vs Callable in real code?
- What does volatile actually guarantee, and why it doesn't make code thread-safe?
- How the Java Memory Model impacts visibility and ordering
- Why sleep() and wait() solve very different problems

### Locks and Synchronization (this shows seniority)
- synchronized vs ReentrantLock and why both still matter
- Intrinsic locks vs explicit locks and when fairness is important
- How ReadWriteLock improves throughput and when it can backfire
- How deadlocks happen in production, not just in theory

### Thread Pools and Executors (where most real bugs live)
- Choosing between fixed, cached, and work-stealing thread pools
- Sizing thread pools for CPU-bound vs IO-bound workloads
- What really happens when executor queues fill up
- When CompletableFuture improves clarity and when it hides complexity

### Concurrent Collections (easy to misuse)
- Why ConcurrentHashMap scales better than synchronized collections
- What happens internally when multiple threads update the same map
- When CopyOnWriteArrayList is a good idea and when it's a terrible one

### Real-World Scenarios Interviewers Love
- Making a service thread-safe without destroying throughput
- Handling shared mutable state in high-traffic microservices
- Debugging race conditions that only appear in production

---

## IMAGE 13: JPMorgan Java Developer Interview Questions (12 Questions)

1. How can we make an existing HashMap thread-safe without using ConcurrentHashMap?
2. How do you ensure consistent data across multiple application instances? For example, if two JVM instances are running and a value is updated in App1 (JVM1), how will it be reflected in App2 (JVM2)?
3. Can we use @Transactional on protected or private methods?
4. What is the internal implementation of the @Transactional annotation?
5. Your application is deployed to production and experiencing high traffic. How would you handle it? What scaling strategies would you use?
6. How do you get alerts for 500 Internal Server Errors occurring every 5 minutes?
7. How do you handle partial failures in microservices architecture?
8. How would you log all methods annotated with @Transactional? (Provide pseudo code.)
9. If your Kafka-based application is deployed with multiple consumer instances, how do you ensure that only one consumer instance processes messages from a topic? Which configuration/property would you use?
10. How do you handle failures during Kafka message consumption in microservices?
11. How do you handle duplicate payments if a customer accidentally clicks the "Pay" button multiple times? How do you identify and inform the client about duplicates?
12. How do you achieve zero data loss in your application?

---

## IMAGE 14: Spring Boot Basics & Fundamentals (21 Questions)

1. What is Spring and Spring Boot? What are the advantages of Spring Boot?
2. What are Spring Boot starters?
3. What is the default port number of a Spring Boot application?
4. What is IoC (Inversion of Control)?
5. What is Dependency Injection (DI) and what are the types of DI?
6. What is Autowiring? What are the different Autowiring modes?
7. What is a Spring Bean and life cycle of Spring Bean and scopes of Bean?
8. What is a REST API?
9. What are the HTTP methods used in REST API?
10. What is JSON and XML?
11. What is JWT (JSON Web Token) and OAuth?
12. What is Spring Security?
13. How do you secure REST APIs in Spring Boot?
14. What is Microservices architecture and Monolithic architecture?
15. How do microservices communicate with each other?
16. What is an API Gateway?
17. What is Spring Data JPA?
18. What is a Repository, types of Repositories?
19. (Skipped — no 19 in source)
20. How do you handle exceptions in Spring Boot?
21. What is application.properties or application.yml?

---

## IMAGE 15: Round 1 Java Interview Questions (20 Questions)

1. How does HashMap work internally? Explain buckets, hashing mechanism, and resizing process.
2. What is the difference between HashMap and ConcurrentHashMap?
3. Explain the JVM memory architecture (Heap, Stack, Metaspace).
4. What are common causes of OutOfMemoryError in production? How would you troubleshoot it?
5. How do you make a class thread-safe? Provide a practical example.
6. Describe the complete lifecycle of a Spring Bean.
7. How does Dependency Injection function internally in Spring?
8. What happens internally when you use @Transactional?
9. What is the difference between @Component, @Service, and @Repository?
10. How would you implement global exception handling in Spring Boot?
11. What is lazy vs eager loading in JPA? In which scenarios can it impact performance?
12. How do you manage concurrent updates to the same database record?
13. Explain ACID properties using a banking transaction example.
14. How would you optimize a slow-performing SQL query?
15. How would you design pagination and sorting in a REST API?
16. Explain the step-by-step flow of JWT authentication.
17. If your API performance degrades under load, how would you identify the bottleneck?
18. REST vs Messaging (Kafka) when would you choose each approach?
19. How would you Dockerize a Spring Boot application?
20. If two microservices fail during communication, how would you implement fault tolerance?

---

## IMAGE 16: Scenario-Based Java Interview Questions (20 Questions)

1. Your HashMap suddenly starts performing very slowly with large data. What internal behavior could cause this?
2. A ConcurrentModificationException appears randomly in production. What coding mistake might cause it?
3. Your API response time increased after switching from ArrayList to LinkedList. Why?
4. A static variable starts causing inconsistent data across requests. Why can static state be dangerous?
5. Your application crashes with StackOverflowError. What kind of bug usually leads to this?
6. An API endpoint creates thousands of objects per request and performance drops. What JVM behavior might explain this?
7. Two threads updating the same object sometimes produce wrong values. What concurrency issue could this be?
8. A HashSet suddenly starts allowing duplicates. What mistake might exist in the object class?
9. Your application becomes slow after adding heavy logging statements. Why can logging affect performance?
10. An API endpoint blocks the entire service during heavy traffic. What coding pattern might cause this?
11. A Java Stream pipeline produces unexpected results in parallel execution. Why might this happen?
12. Your application becomes unstable after introducing caching. What design mistake might exist?
13. A background thread silently dies and stops processing tasks. Why might this happen?
14. Your application creates too many threads and the server becomes unstable. What should be used instead?
15. An API occasionally returns stale data even though the database is updated. What could be wrong?
16. Your equals() method works but HashMap lookups fail. What method might be missing?
17. After deploying on a multi-core machine performance actually drops. Why might that happen?
18. A scheduled job suddenly runs multiple times instead of once. What configuration issue might cause this?
19. A memory leak appears even though objects are no longer used. What references might still hold them?
20. Your service becomes slower after introducing synchronized blocks. Why?

---

## IMAGE 17: Production Scenario-Based Questions (20 Questions)

1. Your Java API suddenly starts returning very slow responses after a traffic spike. What internal issue could cause this?
2. A HashMap in your service sometimes loses data unexpectedly. What coding mistake could lead to this?
3. After deploying a small change, the JVM memory usage suddenly doubles. What could explain this?
4. Your application becomes unstable when too many threads are created dynamically. What is the underlying problem?
5. A REST endpoint works fine with few users but crashes when thousands of requests arrive. Why might that happen?
6. Your system occasionally returns partially updated data during concurrent requests. What concurrency issue might exist?
7. A background job sometimes runs twice even though it was scheduled once. What might cause this?
8. After adding caching, users start seeing outdated responses. What design issue might exist?
9. Your Java service suddenly throws ClassCastException in production but not in testing. Why?
10. An API endpoint suddenly starts consuming huge memory for a simple operation. What might be happening?
11. A synchronized block added for safety starts slowing down the entire application. Why?
12. Your application throws IllegalStateException under heavy traffic. What situation might cause this?
13. A thread pool keeps growing but tasks are still delayed. What could be misconfigured?
14. A microservice call blocks your main request threads for a long time. What should be investigated?
15. Your application logs suddenly increase disk I/O and slow down the service. Why?
16. A long-running loop accidentally blocks an important worker thread. What kind of issue is this?
17. After enabling parallel processing, CPU usage spikes but throughput doesn't improve. Why?
18. Your service sometimes processes the same request twice. What design issue might cause this?
19. A Java service deployed on multiple instances starts behaving inconsistently. What shared-state issue could exist?
20. A small bug causes a recursive method to run indefinitely until the application crashes. What error does this lead to?

---

## IMAGE 18: Java / Spring Boot Developer Interview (~3 Years Experience)

### Core Java
- What are the different data types in Java?
- What is the difference between a local variable and a global variable? Can they have the same name?
- What is the difference between List and Set in Java?
- Can we insert an element at any position in a List?
- Can a Map have a null key?
- What happens if we insert another value with the same key in a Map?
- What is the purpose of static methods in Java?

### Collections & Logic
- Behavior of List insertion order
- Handling duplicate elements
- Basic logical questions around iteration and data structures

### Spring Boot
- What are Spring Boot Starters?
- What is the starting point of a Spring Boot application?
- Difference between @PostMapping and @PutMapping
- Can we use @RequestBody with @GetMapping? Why or why not?
- How do we send data to a GET API?
- What is @Autowired and why do we use it instead of creating objects using new?
- What is Spring Boot Actuator and why is it used?

### JPA / Database
- How do you map a Java object with a database table?
- How do you define a composite primary key in an entity class?
- How do you retrieve data from a table using JPA Repository?
- How do you write custom queries in JPA?

### Exception Handling
- What happens if an exception occurs inside a loop within a try-catch block?
- What happens if the try-catch block is outside the loop?

### REST API Concepts
- How does data from Postman map to a controller method?
- Which annotation is used to map request data to a Java object?

### Performance Optimization
- If a piece of code that usually takes less than 5 seconds suddenly takes 5–10 minutes, how would you investigate and optimize it?

### Testing
- Which annotation is used for a test class in Spring Boot?
- How do you verify the expected result in a test method?

---

## IMAGE 19: Deloitte/HashedIn Interview Topics & Questions

### Java & Core Concepts
- Java Streams — Functional-style processing (filter, map, reduce), lazy evaluation, sequential vs parallel streams
- Intermediate vs Terminal Operations in Streams
- Immutability in Java
- Volatile keyword and thread visibility
- Transient keyword (Serialization)
- Functional Interfaces and Lambda expressions
- Shallow Copy vs Deep Copy
- Stack vs Heap Memory

### Coding / Problem Solving
- Largest Sum Subarray Problem (Kadane's Algorithm) — Implemented, debugged, and explained code with time & space complexity

### Database
- Relational vs Non-Relational Databases
- Experience with MySQL, Oracle, PostgreSQL
- DML Commands — SELECT, INSERT, UPDATE, DELETE
- ACID Properties
- Difference between DELETE, DROP, TRUNCATE (Rollback behavior)

### Spring & JPA
- JPA — How it works internally (Entity Manager, ORM)
- Spring vs Spring Boot
- BeanFactory and Bean Lifecycle
- @Qualifier Annotation
- Bean Scopes — Singleton, Prototype, Request, Session
- Caching in Hibernate/JPA

### Additional Discussion
- JDK Version (Java 11)
- Hands-on coding platform usage
- Debugging approach and explanation of logic

### Feedback / Takeaways
- Emphasis on clear and precise communication
- Strong focus on fundamentals and real-time coding ability

---

## IMAGE 20: Java Backend Interview Questions (30 Questions with Categories)

### (Continued from previous — likely starts at #12)
12. What is the difference between Predicate, Function and Consumer?
13. What is Optional class and why was it introduced?

### Spring Boot
14. How does Spring Boot Auto Configuration work internally?
15. Difference between @Component, @Service, and @Repository.
16. What is Spring Boot Actuator and why is it used?
17. Difference between @Value and @ConfigurationProperties.
18. What is Spring Boot Starter and how does it simplify dependency management?

### Spring Security
19. How do you implement JWT authentication in Spring Boot?
20. What is the difference between Authentication and Authorization?
21. How do you secure REST APIs in Spring Boot?

### Microservices
22. What is the role of an API Gateway in Microservices architecture?
23. What is Service Discovery and how does it work?
24. Difference between Synchronous vs Asynchronous communication between microservices.
25. What is the Circuit Breaker pattern?
26. What is the Bulkhead pattern in microservices?
27. What is Distributed Tracing?

### Hibernate / JPA
28. What is the N+1 problem in Hibernate?
29. Difference between Lazy and Eager fetching.
30. Difference between save() and saveAndFlush().

---

---

# BATCH 2 — Additional Questions

---

## IMAGE 21: Scenario-Based Java Questions (Real Systems Behavior, 20 Questions)

1. Your HashMap performance suddenly drops with large data. What internal change could cause this?
2. A method works fine in testing but throws NullPointerException randomly in production. Why?
3. Your application creates too many objects and performance degrades. What JVM behavior is involved?
4. Two threads updating the same data sometimes give wrong results. What issue is this?
5. Your API becomes slow after adding synchronized blocks. Why does this happen?
6. A background thread stops working without any error. What might be the reason?
7. Your application behaves inconsistently across multiple instances. What design issue could cause this?
8. A loop in your code suddenly causes CPU spikes. What kind of bug could this be?
9. Your system returns duplicate data even though logic seems correct. What could be wrong?
10. After introducing caching, users sometimes see stale data. Why?
11. A method that should be fast suddenly takes much longer under load. What could be happening internally?
12. Your application crashes with StackOverflowError. What kind of code usually causes this?
13. A shared resource is accessed by multiple threads and causes unpredictable behavior. What is missing?
14. Your service works fine with few users but slows down heavily under load. Why?
15. Your equals() method is correct but collections still behave incorrectly. What might be missing?
16. After adding multithreading, performance actually drops. Why can that happen?
17. Your logs suddenly increase and system performance drops. How can logging impact performance?
18. A retry mechanism causes system overload during failures. What mistake might be there?
19. Your application sometimes processes the same request twice. What design issue could cause this?
20. A small change in code leads to unexpected runtime behavior. Why is debugging harder in concurrent systems?

---

## IMAGE 22: PhonePe Interview Topics (SWE-2 / Senior SWE, 44-85 LPA)

### DSA/Coding
1. Arrays/Strings: two-sum variants, move zeros, anagrams, longest prefix
2. Graphs/Trees: BFS/DFS, shortest path, tree re-rooting, DSU
3. DP staples: LIS, coin change
4. Binary search patterns; streamy transforms (filter → map → reduce)

### System Design
1. Design a UPI-style payment service
2. Transaction feed service, inspired by TStore
3. In-app Inbox/Alerts/chat-like pub-sub ala Bullhorn
4. Job scheduler at scale like Clockwork
5. Metrics platform for SLOs

### Core Java/Backend
1. HashMap vs ConcurrentHashMap, equals/hashCode contract, immutability
2. Threads vs executors, JMM basics, GC tuning (G1/ZGC talk-throughs)
3. Java 8/11/17 features in practice (streams, records, var, switch, text blocks)
4. Resilience in prod: retries, timeouts, circuit breakers (what + where)

### Spring/Microservices/Database
1. Spring Boot auto-config, configuration profiles, Actuator/health
2. REST design: validation, versioning, idempotency; SAGA/outbox patterns
3. Kafka (ordering, retries, DLQs) and RabbitMQ (work queues) in payments flows
4. Observability: metrics/tracing; dealing with 300B+ metrics/day style scale
5. Index design & trade-offs; deduping rows; window functions vs GROUP BY
6. Transaction isolation, pagination strategies; read-vs-write models for feeds

---

## IMAGE 23: Java 8 Stream API & Functional Interface Deep Dive (36 Questions)

1. Why can a Stream be consumed only once? What would happen if we try to reuse the same stream?
2. Why do we need Stream if we can write code without stream API?
3. Can you explain Stream Pipeline Structure?
4. Why are intermediate operations called lazy?
5. If a stream pipeline contains multiple filter() operations, does it iterate the collection multiple times? Explain.
6. You are processing a list of 10 million records using Streams. After applying multiple filters and a map operation, the performance becomes slow. What factors would you check to identify the problem?
7. A developer replaces a traditional loop with Streams but the code becomes harder to read. In what scenarios should Streams be avoided?
8. Can Streams modify the original collection?
9. What is the difference between map() and flatMap() conceptually? When would you prefer flatMap?
10. Why is forEach() considered a terminal operation while peek() is intermediate?
11. Why is Stream not a data structure?
12. What happens if we modify the source collection while the stream is being processed?
13. Can a Stream pipeline run without a terminal operation?
14. What is Parallel Stream and how does Java decide how many threads to use in a parallel stream?
15. What kind of operations are not suitable for Parallel Streams?
16. Parallel Streams internally use which thread pool? Can it affect other tasks?
17. If a stream operation depends on previous results, should we use Parallel Stream? Why?
18. When should we prefer sequential streams over parallel streams?
19. What makes an interface a Functional Interface? Can it have multiple methods?
20. Why does Java allow multiple default methods in a functional interface but only one abstract method?
21. Can a Functional Interface extend another interface? What happens if both have abstract methods?
22. Can a functional interface contain static methods?
23. Give some examples of Functional Interface?
24. What is the purpose of the @FunctionalInterface annotation if it is optional?
25. Why does Comparator qualify as a functional interface even though it has many methods?
26. What is the difference between Predicate, Function, Consumer, and Supplier conceptually?
27. How does the compiler determine which method a lambda expression refers to?
28. Why must variable use inside lambda expressions be final or effectively final?
29. What is the difference between lambda expressions and anonymous class?
30. Can lambda expressions access instance variables and static variables?
31. Why can't we use lambda expressions without a functional interface?
32. What is a method reference and why do we need it?
33. Why was Optional introduced in Java 8? What problem does it solve?
34. What is the difference between orElse() and orElseGet() conceptually?
35. Difference between Optional.of() and Optional.ofNullable()?
36. Explain the Java 8 Date Time API?

---

## IMAGE 24: Java + Spring Interview Discussion (14 Questions)

1. How @RequestBody works internally in Spring Boot
2. End-to-end flow of how an Entity class eventually becomes a table in the database (JPA → Hibernate → SQL)
3. Why we use @Service and @Repository, what Spring does differently with them internally
4. What happens if both @Service and @Repository are used on the same class
5. Thread lifecycle — especially NEW vs RUNNABLE states
6. Fail-Fast vs Fail-Safe iterators (with real examples)
7. Why ConcurrentHashMap exists and when to use it
8. What an API Gateway does in a microservices setup

### Coding / Hands-on Questions
9. 2Sum problem (follow-up: 3Sum)
10. Filtering employees above a certain salary using Java Streams
11. Finding average salary using Streams
12. Grouping employees by department (Streams + follow-up in SQL)
13. Self join in SQL and real use cases

### Java Basics Check
14. Output and execution order of try–catch–finally blocks

---

## IMAGE 25: Comprehensive Java Interview — 40 Questions (All Categories)

### Java Basics & OOP
1. What are the main principles of OOP in Java?
2. Difference between abstract class and interface
3. Can a class implement multiple interfaces? Why?
4. What is method overloading vs overriding?
5. What is encapsulation and why is it important?
6. What is polymorphism (compile-time vs runtime)?

### Memory & JVM
7. What is the difference between Heap and Stack memory?
8. What causes OutOfMemoryError?
9. How does Garbage Collection work?
10. Difference between G1GC, ZGC, and Parallel GC
11. What is the Java Memory Model (JMM)?
12. What are strong, weak, soft, and phantom references?

### Collections Framework
13. How does HashMap work internally?
14. What happens during hash collisions?
15. Difference between HashMap, LinkedHashMap, TreeMap
16. How does ConcurrentHashMap work?
17. Difference between ArrayList and LinkedList
18. How does HashSet ensure uniqueness?

### Concurrency & Multithreading
19. What is thread vs process?
20. What is synchronized keyword and how it works?
21. What is volatile and when to use it?
22. What is CAS (Compare-And-Swap)?
23. Difference between ExecutorService and Thread
24. What is deadlock and how to avoid it?
25. What is ThreadLocal and when to use it?

### Exception Handling
26. Difference between checked and unchecked exceptions
27. What happens if an exception is not handled?
28. What is finally block and when is it executed?

### Java Internals
29. Why do we override equals() and hashCode() together?
30. What makes a class immutable?
31. How does String pool work in Java?
32. Difference between String, StringBuilder, StringBuffer
33. What is class loader and how it works?

### Java 8+
34. What is a functional interface?
35. Difference between map() and flatMap()
36. What are Streams and how they work internally?
37. Difference between parallel stream and sequential stream
38. What problems can occur with parallel streams?

### Async & Advanced Concepts
39. What is the difference between Future and CompletableFuture?
40. How does ForkJoinPool work and what is work-stealing?

---

## IMAGE 26: Java Interview Scenario Questions with Answers (3 Questions)

1. Your Java service starts throwing OutOfMemoryError even though heap size looks sufficient. Why?
   - Memory leak due to objects being referenced (not eligible for GC)
   - Large number of objects created and retained in collections
   - Improper use of caches without eviction
   - High GC pressure causing memory not being freed efficiently

2. Multiple threads update shared data and results become inconsistent. Why?
   - Lack of synchronization (race condition)
   - Non-thread-safe data structures used
   - Missing locks or improper concurrency control
   - Visibility issues (no use of volatile or proper synchronization)

3. Your application becomes slower after increasing thread pool size. Why?
   - Context switching overhead increases
   - Threads competing for limited resources (CPU, DB connections)
   - Lock contention increases
   - More threads ≠ better performance in CPU-bound tasks

---

## IMAGE 27: Spring Boot Internals Deep Dive (30 Questions)

1. (Not visible — cut off at top)
2. (Not visible — cut off at top)
3. (Not visible — cut off at top)
4. (Not visible — cut off at top)
5. What is the exact startup flow of a Spring Boot application?
6. Difference between @ComponentScan and @SpringBootApplication?
7. How does Spring Boot detect embedded Tomcat automatically?
8. What happens if two beans of the same type exist without @Qualifier?
9. How does Spring Boot load profile-specific configurations?
10. What is the role of SpringFactoriesLoader?
11. How did Spring Boot remove XML configuration almost completely?
12. Difference between @RestController and @Controller internally?
13. How does Spring Boot manage dependency versions automatically?
14. What is the complete lifecycle of a Spring Bean?
15. How does Spring Boot handle externalized configuration?
16. What happens if application.yml and application.properties both exist?
17. How does Spring Boot integrate with Actuator internally?
18. How does @ConditionalOnClass work internally?
19. How does Spring Boot enable AutoConfiguration automatically?
20. What happens internally when you use @EnableAutoConfiguration?
21. How does Spring Boot create embedded servlet containers?
22. What happens internally when @ConfigurationProperties is used?
23. How does Spring Boot implement dependency injection internally?
24. What happens internally when @Autowired is processed?
25. How does Spring Boot resolve circular dependencies?
26. What happens during Spring Boot application context initialization?
27. What is the role of ApplicationContext vs BeanFactory?
28. How does Spring Boot support multiple environments / profiles?
29. What happens internally when you use @SpringBootApplication?
30. How does Spring Boot enable hot reload using DevTools?

---

## IMAGE 28: JPA/Hibernate, Microservices, DevOps & Coding Questions

### (Continued from previous — likely starts with Spring Boot)
19. What is @Transactional?
20. How do you implement pagination & sorting in Spring Boot?

### JPA / Hibernate & Database
21. Difference between save(), persist(), merge()
22. What is lazy loading vs eager loading?
23. What is N+1 problem?
24. Explain @OneToMany and @ManyToOne mapping
25. What are entity states in Hibernate?
26. What is indexing and how it improves performance?
27. Difference between INNER JOIN vs LEFT JOIN
28. What is ACID property?
29. Write SQL to find second highest salary
30. How do you optimize slow SQL queries?

### Microservices & Architecture
1. Difference between monolithic vs microservices architecture
2. What is API Gateway?
3. What is Service Discovery?
4. How do microservices communicate? (REST / Kafka)
5. What is Circuit Breaker pattern?
6. How do you handle configuration management?
7. What is load balancing?
8. How do you ensure fault tolerance?
9. What is idempotent API?
10. How do you implement logging & monitoring?

### Cloud & DevOps Basics
1. What is Docker?
2. Difference between Docker image vs container
3. What is CI/CD pipeline?
4. How does Jenkins pipeline work?
5. What is Kubernetes (basic)?
6. Difference between vertical vs horizontal scaling
7. What is Blue-Green deployment?

### Coding Round (Common in HCL)
1. Reverse a string
2. Find duplicate elements in array
3. First non-repeating character
4. Check palindrome string
5. Find second largest number
6. Reverse linked list

---

---

# BATCH 3 — Additional Questions

---

## IMAGE 29: Experienced Level Java Backend (20 Questions + Basics Tail)

### (Basics — tail end visible)
16. Difference between REST vs SOAP APIs.
17. What is JPA and Hibernate?
18. What is Microservices architecture?
19. How does JWT Authentication work?
20. Difference between Monolithic vs Microservices architecture.

### Experienced Level Java Backend
1. How does HashMap work internally in Java?
2. How does ConcurrentHashMap handle concurrency?
3. Explain Thread Pools and Executor Framework.
4. What causes Deadlock and how do you prevent it?
5. Explain Java Garbage Collection algorithms (G1, CMS, etc.).
6. How does Spring Boot Auto Configuration work?
7. Explain Bean Lifecycle in Spring.
8. How does Transaction Management work in Spring?
9. How do you handle database connection pooling?
10. Explain API Rate Limiting implementation.
11. How do you implement Distributed Caching using Redis?
12. Explain Idempotency in APIs.
13. How do you design fault-tolerant microservices?
14. How does Kafka work in event-driven architecture?
15. How do you handle high traffic on backend APIs?
16. Explain Circuit Breaker pattern.
17. How do you implement distributed transactions?
18. How do you design a scalable notification system?
19. How do you monitor production microservices?
20. How do you debug memory leaks in Java applications?

---

*Total: 650+ Java backend interview questions covering Core Java, JVM internals, Java 8+ Streams & Functional Interfaces, Spring Boot internals, Microservices, Database/JPA, System Design, Production Debugging, DSA/Coding, and Cloud/DevOps.*
