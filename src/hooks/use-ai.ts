"use client";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { createAIProvider, type AIProvider } from "@/lib/ai";

export function useAI(): AIProvider | null {
  const apiKey = useStore((s) => s.apiKey);
  const aiProvider = useStore((s) => s.aiProvider);
  return useMemo(() => {
    // Ollama doesn't need an API key — it runs locally
    if (aiProvider === "ollama") {
      return createAIProvider("ollama", aiProvider);
    }
    if (!apiKey) return null;
    return createAIProvider(apiKey, aiProvider);
  }, [apiKey, aiProvider]);
}
