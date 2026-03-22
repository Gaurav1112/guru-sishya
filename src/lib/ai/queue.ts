// ────────────────────────────────────────────────────────────────────────────
// AI Request Queue
//
// Processes one AI request at a time to prevent flooding API providers.
// Emits status events so the UI can show queue position.
// ────────────────────────────────────────────────────────────────────────────

export type QueueEventType =
  | "queue-position"
  | "processing"
  | "complete"
  | "error";

export interface QueueEvent {
  type: QueueEventType;
  position?: number;
  queueLength?: number;
  error?: Error;
}

type QueueListener = (event: QueueEvent) => void;

interface QueuedRequest {
  execute: () => Promise<string>;
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}

/** Minimum delay (ms) between consecutive requests to avoid burst traffic. */
const MIN_DELAY_BETWEEN_REQUESTS_MS = 300;

export class AIRequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private listeners: Set<QueueListener> = new Set();
  private lastRequestTime = 0;

  /**
   * Add a request to the queue. Returns a promise that resolves with the
   * AI response once the request reaches the front of the queue and completes.
   */
  enqueue(request: () => Promise<string>): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.queue.push({ execute: request, resolve, reject });
      this.emit({
        type: "queue-position",
        position: this.queue.length,
        queueLength: this.queue.length,
      });
      this.processNext();
    });
  }

  /** Number of requests waiting (including the one currently processing). */
  getQueueLength(): number {
    return this.queue.length + (this.processing ? 1 : 0);
  }

  /** Whether a request is currently being processed. */
  isProcessing(): boolean {
    return this.processing;
  }

  /** Subscribe to queue events. Returns an unsubscribe function. */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: QueueEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Listener errors must not break queue processing
      }
    }
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    const item = this.queue.shift();
    if (!item) return;

    this.processing = true;
    this.emit({ type: "processing", queueLength: this.queue.length });

    // Notify remaining items of their new position
    this.queue.forEach((_, idx) => {
      this.emit({
        type: "queue-position",
        position: idx + 1,
        queueLength: this.queue.length,
      });
    });

    try {
      // Throttle: wait if the last request was too recent
      const elapsed = Date.now() - this.lastRequestTime;
      if (elapsed < MIN_DELAY_BETWEEN_REQUESTS_MS) {
        await sleep(MIN_DELAY_BETWEEN_REQUESTS_MS - elapsed);
      }

      const result = await item.execute();
      this.lastRequestTime = Date.now();
      item.resolve(result);
      this.emit({ type: "complete", queueLength: this.queue.length });
    } catch (err) {
      this.lastRequestTime = Date.now();
      item.reject(err);
      this.emit({
        type: "error",
        error: err instanceof Error ? err : new Error(String(err)),
        queueLength: this.queue.length,
      });
    } finally {
      this.processing = false;
      // Process next item in queue
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Singleton queue instance shared across the app. */
export const globalAIQueue = new AIRequestQueue();
