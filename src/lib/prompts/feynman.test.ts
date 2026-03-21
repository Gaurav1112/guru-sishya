import { describe, it, expect } from "vitest";
import {
  feynmanPrimePrompt,
  feynmanTeachPrompt,
  feynmanRecallPrompt,
  feynmanProbePrompt,
  feynmanStrugglePrompt,
  feynmanReteachPrompt,
  feynmanVerifyPrompt,
  antiParrotingPrompt,
} from "./feynman";

describe("feynmanPrimePrompt", () => {
  it("returns system and user strings", () => {
    const result = feynmanPrimePrompt("Programming", "recursion");
    expect(result).toHaveProperty("system");
    expect(result).toHaveProperty("user");
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
  });

  it("includes topic and concept in prompts", () => {
    const result = feynmanPrimePrompt("Programming", "recursion");
    expect(result.system).toContain("Programming");
    expect(result.user).toContain("recursion");
  });
});

describe("feynmanTeachPrompt", () => {
  it("includes mermaid requirement in system prompt", () => {
    const result = feynmanTeachPrompt("Math", "derivatives", "I know calculus basics");
    expect(result.system).toContain("mermaid");
    expect(result.system.toLowerCase()).toContain("analogy");
  });

  it("incorporates prior knowledge", () => {
    const priorKnowledge = "I studied calculus in high school";
    const result = feynmanTeachPrompt("Math", "derivatives", priorKnowledge);
    expect(result.system).toContain(priorKnowledge);
  });
});

describe("feynmanRecallPrompt", () => {
  it("returns prompt that asks for JSON with correct fields", () => {
    const result = feynmanRecallPrompt("recursion", "AI explanation", "user explanation");
    expect(result.system).toContain("completeness");
    expect(result.system).toContain("accuracy");
    expect(result.system).toContain("depth");
    expect(result.system).toContain("originality");
    expect(result.system).toContain("gaps");
    expect(result.system).toContain("feedback");
  });

  it("includes original and user explanations in user prompt", () => {
    const original = "AI original explanation text";
    const user = "Student explanation text";
    const result = feynmanRecallPrompt("recursion", original, user);
    expect(result.user).toContain(original);
    expect(result.user).toContain(user);
  });
});

describe("feynmanProbePrompt", () => {
  it("includes gaps in user prompt", () => {
    const gaps = ["missed base case", "unclear stack behaviour"];
    const result = feynmanProbePrompt("recursion", gaps, "student explanation");
    expect(result.user).toContain("missed base case");
    expect(result.user).toContain("unclear stack behaviour");
  });

  it("system prompt says ask ONE question", () => {
    const result = feynmanProbePrompt("recursion", ["gap1"], "explanation");
    expect(result.system).toMatch(/one/i);
  });
});

describe("feynmanStrugglePrompt", () => {
  it("returns valid prompt with concept", () => {
    const result = feynmanStrugglePrompt("recursion", "conversation context here");
    expect(result.system).toContain("recursion");
    expect(result.user).toContain("conversation context here");
  });
});

describe("feynmanReteachPrompt", () => {
  it("references previous analogy in system prompt", () => {
    const prevAnalogy = "like a Russian doll";
    const result = feynmanReteachPrompt("recursion", prevAnalogy, ["missed base case"]);
    expect(result.system).toContain(prevAnalogy);
  });

  it("includes gaps in system prompt", () => {
    const gaps = ["base case", "stack overflow"];
    const result = feynmanReteachPrompt("recursion", "some analogy", gaps);
    expect(result.system).toContain("base case");
    expect(result.system).toContain("stack overflow");
  });

  it("handles empty gaps gracefully", () => {
    const result = feynmanReteachPrompt("recursion", "analogy", []);
    expect(result.system).toContain("No major gaps");
  });
});

describe("feynmanVerifyPrompt", () => {
  it("requests mastered boolean in JSON schema", () => {
    const result = feynmanVerifyPrompt("recursion", "user final explanation");
    expect(result.system).toContain("mastered");
    expect(result.system).toContain("completeness");
    expect(result.system).toContain("accuracy");
  });

  it("includes user final explanation in user prompt", () => {
    const explanation = "Recursion is when a function calls itself";
    const result = feynmanVerifyPrompt("recursion", explanation);
    expect(result.user).toContain(explanation);
  });
});

describe("antiParrotingPrompt", () => {
  it("asks about isParroting in JSON schema", () => {
    const result = antiParrotingPrompt("original AI text", "student copy");
    expect(result.system).toContain("isParroting");
    expect(result.system).toContain("reason");
  });

  it("includes both texts in user prompt", () => {
    const original = "original explanation from AI";
    const student = "student's version of explanation";
    const result = antiParrotingPrompt(original, student);
    expect(result.user).toContain(original);
    expect(result.user).toContain(student);
  });
});
