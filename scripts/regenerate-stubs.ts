#!/usr/bin/env npx tsx

/**
 * Content Regeneration Script
 *
 * Scans all content JSON files for sessions with stub/placeholder code
 * and regenerates them using Claude API.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/regenerate-stubs.ts
 *
 * Options:
 *   --dry-run    List stubs without regenerating
 *   --file=X     Only process a specific file
 *   --limit=N    Regenerate at most N sessions
 */

import * as fs from "fs";
import * as path from "path";

const CONTENT_DIR = path.join(process.cwd(), "public/content");
const API_KEY = process.env.ANTHROPIC_API_KEY;
const DRY_RUN = process.argv.includes("--dry-run");
const FILE_FILTER = process.argv.find(a => a.startsWith("--file="))?.split("=")[1];
const LIMIT = parseInt(process.argv.find(a => a.startsWith("--limit="))?.split("=")[1] || "999");

// Patterns that indicate stub/placeholder content
const STUB_PATTERNS = [
  /\/\/\s*Core implementation/i,
  /\/\/\s*Run the examples/i,
  /\/\/\s*implementation here/i,
  /\/\/\s*TODO/i,
  /System\.out\.println\("[^"]*implementation[^"]*"\)/i,
  /print\("[^"]*implementation[^"]*"\)/i,
  /\/\/\s*Add your code here/i,
  /\/\/\s*Your code here/i,
  /pass\s*#\s*placeholder/i,
];

interface StubSession {
  file: string;
  topicIndex: number;
  sessionIndex: number;
  topicName: string;
  sessionTitle: string;
  currentContent: string;
}

function isStub(content: string): boolean {
  if (!content || content.length < 500) return true;
  return STUB_PATTERNS.some(p => p.test(content));
}

function findStubs(): StubSession[] {
  const stubs: StubSession[] = [];
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".json"));

  for (const file of files) {
    if (FILE_FILTER && file !== FILE_FILTER) continue;

    try {
      const data = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), "utf8"));
      const topics = Array.isArray(data) ? data : [data];

      for (let ti = 0; ti < topics.length; ti++) {
        const topic = topics[ti];
        if (!topic.plan?.sessions) continue;

        for (let si = 0; si < topic.plan.sessions.length; si++) {
          const session = topic.plan.sessions[si];
          if (session.content && isStub(session.content)) {
            stubs.push({
              file,
              topicIndex: ti,
              sessionIndex: si,
              topicName: topic.topic || topic.name || file,
              sessionTitle: session.title || `Session ${si + 1}`,
              currentContent: session.content,
            });
          }
        }
      }
    } catch {}
  }

  return stubs;
}

async function regenerateContent(stub: StubSession): Promise<string> {
  if (!API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

  const prompt = `You are creating educational content for a software engineering interview preparation platform called "Guru Sishya".

Topic: ${stub.topicName}
Session: ${stub.sessionTitle}

Generate a comprehensive lesson for this session. Include:

1. **Concept Explanation** — Clear explanation of the topic with real-world analogies
2. **How It Works** — Step-by-step breakdown with diagrams (use mermaid syntax for flowcharts/diagrams)
3. **Code Examples** — Complete, runnable code in BOTH Java and Python:
   - Java code must be inside a proper class with main method
   - Python code must be complete and runnable
4. **Common Interview Questions** — 3-5 questions an interviewer might ask
5. **Key Takeaways** — Bullet points summarizing the most important concepts
6. **Complexity Analysis** — Time and space complexity where applicable

Format the entire response as markdown with proper headings (##, ###), code blocks (\`\`\`java, \`\`\`python), and mermaid diagrams where appropriate.

The content should be 1500-2500 words, thorough enough that a student can understand the topic without any other resource.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const result = await response.json();
  return result.content[0]?.text || "";
}

async function main() {
  console.log("Scanning for stub sessions...");
  const stubs = findStubs();
  console.log(`Found ${stubs.length} stub sessions\n`);

  if (stubs.length === 0) {
    console.log("No stubs found. All sessions have content.");
    return;
  }

  // List all stubs
  for (const stub of stubs) {
    console.log(`  ${stub.file} -> ${stub.topicName} -> ${stub.sessionTitle} (${stub.currentContent.length} chars)`);
  }

  if (DRY_RUN) {
    console.log("\n--dry-run mode. No changes made.");
    return;
  }

  if (!API_KEY) {
    console.error("\nError: ANTHROPIC_API_KEY environment variable not set.");
    console.error("Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/regenerate-stubs.ts");
    process.exit(1);
  }

  const toProcess = stubs.slice(0, LIMIT);
  console.log(`\nRegenerating ${toProcess.length} sessions...\n`);

  let success = 0;
  let failed = 0;

  for (const stub of toProcess) {
    process.stdout.write(`  [${success + failed + 1}/${toProcess.length}] ${stub.topicName} > ${stub.sessionTitle}...`);

    try {
      const newContent = await regenerateContent(stub);

      // Read file, update session, write back
      const filePath = path.join(CONTENT_DIR, stub.file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const topics = Array.isArray(data) ? data : [data];
      topics[stub.topicIndex].plan.sessions[stub.sessionIndex].content = newContent;
      fs.writeFileSync(filePath, JSON.stringify(Array.isArray(data) ? topics : topics[0], null, 2));

      success++;
      console.log(" done");

      // Rate limit: wait 1s between API calls
      await new Promise(r => setTimeout(r, 1000));
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(` FAILED: ${message}`);
    }
  }

  console.log(`\nDone: ${success} regenerated, ${failed} failed.`);
}

main().catch(console.error);
