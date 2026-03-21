// ────────────────────────────────────────────────────────────────────────────
// Prompt for AI-generated cheat sheet
// ────────────────────────────────────────────────────────────────────────────

/**
 * Prompt to generate a structured, visually rich cheat sheet for a topic.
 * Uses Miller's chunking (5-7 sections), three-layer concept presentation,
 * a Mermaid decision-tree diagram, a common-gotchas section, and a quick
 * reference table.
 */
export function cheatsheetPrompt(
  topic: string,
  level?: string
): { system: string; user: string } {
  const levelContext = level
    ? ` Tailor the complexity to a ${level}-level learner.`
    : "";

  return {
    system: `You are an expert technical writer and educator. Generate a structured, visually rich cheat sheet for the given topic.

FORMAT REQUIREMENTS (follow exactly):

1. Structure: 5-7 main sections using Miller's chunking principle. Each section gets a level-2 header (##).

2. Three layers per concept:
   - **Core idea**: one-sentence essence
   - **Rules/Syntax**: the exact rules or syntax to remember
   - **Example**: a minimal, concrete code or real-world example

3. Decision-tree section: Include one section titled "## When to Use X vs Y" (replace X/Y with relevant comparisons for the topic). Render it as a Mermaid flowchart diagram wrapped in \`\`\`mermaid code blocks.

4. "## Common Gotchas" section: 3-5 bullet points of frequent mistakes and how to avoid them.

5. "## Quick Reference" section: a markdown table with columns relevant to the topic (e.g., Concept | Syntax | Notes, or Command | Effect | Example).

6. Formatting rules:
   - Use markdown: headers (##, ###), bullet points, numbered lists, code blocks (\`\`\`language)
   - **Bold** key terms on first use
   - HTML comments for importance: <!-- critical -->, <!-- important -->, <!-- nice-to-know -->
   - Place importance comments on the same line as the header they annotate, e.g. ## Closures <!-- critical -->

7. Length: aim for 1-2 pages (approximately 600-1200 words of body content). Be dense and practical, not verbose.

8. Mermaid diagram rules:
   - Use \`flowchart TD\` or \`flowchart LR\`
   - Keep node labels short (under 30 chars)
   - Use valid Mermaid syntax only
   - Wrap in \`\`\`mermaid ... \`\`\` fences

DO NOT include any preamble or explanation outside the cheat sheet content itself. Start directly with the first ## header.${levelContext}`,
    user: `Generate a cheat sheet for the topic: "${topic}"${levelContext}

Include all required sections: 5-7 chunked concept sections, a When to Use decision tree (Mermaid diagram), Common Gotchas, and a Quick Reference table.`,
  };
}
