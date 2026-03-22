"use client";
import { useMemo, useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useStore } from "@/lib/store";
import {
  createAIProvider,
  type ResilientStatus,
  globalAIQueue,
  ResilientProvider,
} from "@/lib/ai";
import type { AIProvider } from "@/lib/ai";

// ── useAI ─────────────────────────────────────────────────────────────────
// Returns a ResilientProvider (which implements AIProvider) or null if
// no API key is configured (and provider is not Ollama).

export function useAI(): ResilientProvider | null {
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

// ── useAIStatus ───────────────────────────────────────────────────────────
// Exposes the current resilient provider's status: queue length, current
// provider name, retry status, failed providers, etc.

const DEFAULT_STATUS: ResilientStatus = {
  currentProvider: "",
  retryCount: 0,
  queueLength: 0,
  isProcessing: false,
  lastError: null,
  failedProviders: [],
};

export function useAIStatus(provider: ResilientProvider | null): ResilientStatus {
  const [status, setStatus] = useState<ResilientStatus>(
    provider ? provider.getStatus() : DEFAULT_STATUS
  );

  useEffect(() => {
    if (!provider) {
      setStatus(DEFAULT_STATUS);
      return;
    }

    // Set initial status
    setStatus(provider.getStatus());

    // Subscribe to provider status changes
    const unsubProvider = provider.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to queue events for queue length updates
    const unsubQueue = globalAIQueue.subscribe(() => {
      setStatus(provider.getStatus());
    });

    return () => {
      unsubProvider();
      unsubQueue();
    };
  }, [provider]);

  return status;
}

// ── useAIQueueLength ──────────────────────────────────────────────────────
// Lightweight hook that only tracks queue length for display purposes.

export function useAIQueueLength(): number {
  const subscribe = useCallback((callback: () => void) => {
    return globalAIQueue.subscribe(() => callback());
  }, []);

  const getSnapshot = useCallback(() => {
    return globalAIQueue.getQueueLength();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
