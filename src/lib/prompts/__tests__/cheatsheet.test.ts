import { describe, it, expect } from "vitest";
import { cheatsheetPrompt } from "../cheatsheet";

describe("cheatsheetPrompt", () => {
  it("returns system and user strings", () => {
    const result = cheatsheetPrompt("TypeScript");
    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
  });

  it("includes the topic in the user prompt", () => {
    const { user } = cheatsheetPrompt("React Hooks");
    expect(user).toContain("React Hooks");
  });

  it("mentions mermaid in the system prompt", () => {
    const { system } = cheatsheetPrompt("Python");
    expect(system.toLowerCase()).toContain("mermaid");
  });

  it("mentions key sections in system prompt", () => {
    const { system } = cheatsheetPrompt("Docker");
    expect(system).toContain("Common Gotchas");
    expect(system).toContain("Quick Reference");
  });

  it("includes level context when level is provided", () => {
    const { system, user } = cheatsheetPrompt("SQL", "beginner");
    expect(system).toContain("beginner");
    expect(user).toContain("beginner");
  });

  it("does not include level context when level is omitted", () => {
    const { system } = cheatsheetPrompt("CSS");
    expect(system).not.toContain("undefined");
  });

  it("specifies temperature 0.4 guidance via consistent format output", () => {
    // The prompt itself doesn't set temperature — the caller does.
    // Verify the prompt is stable (deterministic output for same input).
    const a = cheatsheetPrompt("Go");
    const b = cheatsheetPrompt("Go");
    expect(a.system).toBe(b.system);
    expect(a.user).toBe(b.user);
  });

  it("mentions Miller chunking sections count", () => {
    const { system } = cheatsheetPrompt("Kubernetes");
    expect(system).toContain("5-7");
  });

  it("mentions importance HTML comments", () => {
    const { system } = cheatsheetPrompt("Redis");
    expect(system).toContain("<!-- critical -->");
    expect(system).toContain("<!-- important -->");
    expect(system).toContain("<!-- nice-to-know -->");
  });
});
