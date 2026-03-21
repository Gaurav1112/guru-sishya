import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClaudeProvider } from "@/lib/ai/claude";
import { AIError } from "@/lib/ai/types";

// ────────────────────────────────────────────────────────────────────────────
// Mock @anthropic-ai/sdk
// ────────────────────────────────────────────────────────────────────────────

const mockMessagesCreate = vi.fn();
const mockMessagesStream = vi.fn();

vi.mock("@anthropic-ai/sdk", async () => {
  const actual = await vi.importActual<typeof import("@anthropic-ai/sdk")>(
    "@anthropic-ai/sdk"
  );

  class MockAnthropic {
    messages = {
      create: mockMessagesCreate,
      stream: mockMessagesStream,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(_opts: any) {}
  }

  return {
    ...actual,
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeTextResponse(text: string) {
  return {
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("ClaudeProvider – interface compliance", () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new ClaudeProvider("test-api-key");
  });

  it("exposes generateText method", () => {
    expect(typeof provider.generateText).toBe("function");
  });

  it("exposes generateStructured method", () => {
    expect(typeof provider.generateStructured).toBe("function");
  });

  it("exposes streamText method", () => {
    expect(typeof provider.streamText).toBe("function");
  });

  it("exposes gradeAnswer method", () => {
    expect(typeof provider.gradeAnswer).toBe("function");
  });
});

describe("ClaudeProvider – generateText", () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new ClaudeProvider("test-api-key");
  });

  it("returns text from mocked response", async () => {
    mockMessagesCreate.mockResolvedValueOnce(
      makeTextResponse("Hello, Guru Sishya!")
    );

    const result = await provider.generateText(
      "Say hello",
      "You are a helpful assistant"
    );

    expect(result).toBe("Hello, Guru Sishya!");
    expect(mockMessagesCreate).toHaveBeenCalledOnce();
  });

  it("calls messages.create with correct parameters", async () => {
    mockMessagesCreate.mockResolvedValueOnce(makeTextResponse("OK"));

    await provider.generateText("Test prompt", "System prompt", {
      temperature: 0.5,
      maxTokens: 1000,
    });

    const call = mockMessagesCreate.mock.calls[0][0];
    expect(call.model).toBe("claude-sonnet-4-20250514");
    expect(call.system).toBe("System prompt");
    expect(call.messages[0]).toEqual({ role: "user", content: "Test prompt" });
    expect(call.max_tokens).toBe(1000);
    expect(call.temperature).toBe(0.5);
  });

  it("returns empty string when no text block in response", async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: "tool_use", id: "x", name: "tool", input: {} }],
    });

    const result = await provider.generateText("prompt", "system");
    expect(result).toBe("");
  });

  it("throws AIError with invalid_key code on AuthenticationError", async () => {
    const { AuthenticationError } = await import("@anthropic-ai/sdk");
    const authErr = new AuthenticationError(
      401,
      { error: { type: "authentication_error", message: "Invalid API Key" } },
      "Unauthorized",
      new Headers()
    );
    mockMessagesCreate.mockRejectedValueOnce(authErr);

    await expect(
      provider.generateText("prompt", "system")
    ).rejects.toMatchObject({
      code: "invalid_key",
    });
  });
});

describe("ClaudeProvider – generateStructured", () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new ClaudeProvider("test-api-key");
  });

  it("parses structured response", async () => {
    mockMessagesCreate.mockResolvedValueOnce(
      makeTextResponse('{"value": 42}')
    );

    const result = await provider.generateStructured(
      "Give me JSON",
      "system",
      (text) => JSON.parse(text) as { value: number }
    );

    expect(result).toEqual({ value: 42 });
  });

  it("retries once on parse failure", async () => {
    mockMessagesCreate
      .mockResolvedValueOnce(makeTextResponse("invalid json !!!"))
      .mockResolvedValueOnce(makeTextResponse('{"ok": true}'));

    const result = await provider.generateStructured(
      "Give me JSON",
      "system",
      (text) => JSON.parse(text) as { ok: boolean }
    );

    expect(result).toEqual({ ok: true });
    expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
  });
});

describe("ClaudeProvider – streamText", () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new ClaudeProvider("test-api-key");
  });

  it("calls onChunk for each text delta and returns full text", async () => {
    const events = [
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Hello" },
      },
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: " world" },
      },
      { type: "message_stop" },
    ];

    async function* mockAsyncIterator() {
      for (const event of events) yield event;
    }

    mockMessagesStream.mockReturnValueOnce(mockAsyncIterator());

    const chunks: string[] = [];
    const full = await provider.streamText("prompt", "system", (chunk) =>
      chunks.push(chunk)
    );

    expect(chunks).toEqual(["Hello", " world"]);
    expect(full).toBe("Hello world");
  });
});

describe("AIError", () => {
  it("has correct name and code", () => {
    const err = new AIError("Rate limited", "rate_limited", 60);
    expect(err.name).toBe("AIError");
    expect(err.code).toBe("rate_limited");
    expect(err.retryAfter).toBe(60);
    expect(err instanceof Error).toBe(true);
  });
});
