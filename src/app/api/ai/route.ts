import { type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * API route proxy for AI providers that don't support CORS.
 * Browser calls /api/ai → Next.js server forwards to upstream → returns response.
 * This eliminates ALL CORS issues since server-to-server calls have no CORS.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`ai:${ip}`, 20, 60000)) {
    return Response.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { provider, apiKey, endpoint, ...payload } = body as {
    provider: string;
    apiKey: string;
    endpoint?: string;
    [key: string]: unknown;
  };

  const urlMap: Record<string, string> = {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
  };

  const upstream = endpoint || urlMap[provider];
  if (!upstream) {
    return Response.json({ error: "Unknown provider" }, { status: 400 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://guru-sishya.app";
    headers["X-Title"] = "Guru Sishya";
  }

  try {
    const upstreamResponse = await fetch(upstream, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    // For streaming responses, pipe through
    if (payload.stream && upstreamResponse.body) {
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: {
          "Content-Type":
            upstreamResponse.headers.get("Content-Type") ||
            "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Non-streaming: return JSON
    const data = await upstreamResponse.json();
    return Response.json(data, { status: upstreamResponse.status });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    );
  }
}
