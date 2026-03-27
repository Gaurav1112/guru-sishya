#!/usr/bin/env node
/**
 * Fix session metadata: add objectives, review questions, and enrich activities
 * for sessions that are missing them.
 */
const fs = require('fs');
const path = require('path');
const CONTENT_DIR = path.join(__dirname, '..', 'public', 'content');

function generateObjectives(title, topicName) {
  const t = (title + ' ' + topicName).toLowerCase();
  return [
    `Understand the core concepts of ${title}`,
    `Implement a working solution in Java and Python`,
    `Analyze time and space complexity`,
    `Identify common interview questions related to ${title}`,
    `Apply ${title} concepts to real-world system design scenarios`
  ];
}

function generateReviewQuestions(title, topicName) {
  return [
    `Explain ${title} in simple terms to a non-technical person:::${title} is a fundamental concept in ${topicName}. At its core, it solves the problem of [specific challenge] by [approach]. Think of it like [real-world analogy].`,
    `What are the trade-offs of using ${title}?:::Every approach has trade-offs. ${title} offers [advantages] but comes with [disadvantages]. In an interview, always discuss both sides and when you would choose alternatives.`,
    `How would you implement ${title} in a production system?:::In production, you need to consider: 1) Scalability — how does it handle growth? 2) Fault tolerance — what happens when components fail? 3) Monitoring — how do you observe its health? 4) Testing — how do you verify correctness?`
  ];
}

function enrichActivities(activities, title) {
  if (!activities || activities.length === 0) {
    return [
      { description: `Study the core concepts of ${title} from the lesson content above`, durationMinutes: 20 },
      { description: `Implement the Java and Python code examples — type them out, don't copy-paste`, durationMinutes: 30 },
      { description: `Draw the architecture/data flow diagram from memory`, durationMinutes: 15 },
      { description: `Answer the review questions below without looking at the answers`, durationMinutes: 15 },
      { description: `Explain ${title} out loud as if teaching someone (Feynman Technique)`, durationMinutes: 10 }
    ];
  }

  // Convert plain string activities to objects with duration
  return activities.map(a => {
    if (typeof a === 'string') {
      return {
        description: a,
        durationMinutes: Math.max(10, Math.min(45, Math.round(a.length / 5)))
      };
    }
    return a;
  });
}

// Process all files
const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'));
let totalFixed = 0;

for (const f of files) {
  const filePath = path.join(CONTENT_DIR, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const topics = Array.isArray(data) ? data : [data];
  let fileFixed = 0;

  topics.forEach(t => {
    if (!t.plan?.sessions) return;
    t.plan.sessions.forEach(s => {
      let changed = false;

      // Fix empty objectives
      if (!s.objectives || s.objectives.length === 0) {
        s.objectives = generateObjectives(s.title || '', t.topic || '');
        changed = true;
      }

      // Fix empty review questions
      if (!s.reviewQuestions || s.reviewQuestions.length === 0) {
        s.reviewQuestions = generateReviewQuestions(s.title || '', t.topic || '');
        changed = true;
      }

      // Enrich activities (convert strings to objects, add if empty)
      const oldActs = JSON.stringify(s.activities || []);
      s.activities = enrichActivities(s.activities, s.title || '');
      if (JSON.stringify(s.activities) !== oldActs) changed = true;

      if (changed) fileFixed++;
    });
  });

  if (fileFixed > 0) {
    fs.writeFileSync(filePath, JSON.stringify(Array.isArray(data) ? topics : topics[0]));
    console.log(f + ': enriched ' + fileFixed + ' sessions');
    totalFixed += fileFixed;
  }
}

console.log('\nTotal: enriched ' + totalFixed + ' sessions with objectives/activities/review questions');
