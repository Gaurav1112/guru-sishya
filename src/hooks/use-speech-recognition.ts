"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── TypeScript declarations for the Web Speech API ──────────────────────────
// The Web Speech API types are not included in all TS libs,
// so we declare the minimal interfaces we need.

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// Extend the Window interface to include webkit prefix
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ── Hook options ────────────────────────────────────────────────────────────

export interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag. Default: "en-IN" (Indian English) */
  lang?: string;
  /** Keep listening after pauses. Default: true */
  continuous?: boolean;
  /** Show partial results in real-time. Default: true */
  interimResults?: boolean;
}

export interface UseSpeechRecognitionReturn {
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean;
  /** Whether the microphone is actively listening */
  isListening: boolean;
  /** The current transcript (includes interim results while listening) */
  transcript: string;
  /** Only the interim (unfinalized) part of the transcript */
  interimTranscript: string;
  /** Error message if something went wrong */
  error: string | null;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Clear the transcript */
  resetTranscript: () => void;
}

/**
 * A reusable React hook for browser-native speech recognition.
 *
 * Uses the Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * FREE — no external API needed. Works in Chrome, Edge, and Safari.
 *
 * @example
 * ```tsx
 * const { isSupported, isListening, transcript, startListening, stopListening } =
 *   useSpeechRecognition({ lang: "en-IN" });
 * ```
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = "en-IN",
    continuous = true,
    interimResults = true,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");
  // Track whether we intentionally stopped (vs. auto-end)
  const manualStopRef = useRef(false);

  // Check browser support on mount
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setIsSupported(supported);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    // Reset state
    setError(null);
    manualStopRef.current = false;
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");

    // Abort any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not available.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      // Accumulate final transcript
      if (finalText) {
        finalTranscriptRef.current = finalText;
      }

      const combined = (finalTranscriptRef.current + " " + interimText).trim();
      setTranscript(combined);
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errCode = event.error;

      // These are not real errors — just the recognition ending naturally
      if (errCode === "no-speech" || errCode === "aborted") {
        return;
      }

      if (errCode === "not-allowed") {
        setError(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else if (errCode === "network") {
        setError(
          "Network error. Speech recognition requires an internet connection in most browsers."
        );
      } else if (errCode === "service-not-allowed") {
        setError("Speech recognition service is not allowed. Try using Chrome or Edge.");
      } else {
        setError(`Speech recognition error: ${errCode}`);
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Finalize the transcript — set it to whatever we accumulated
      if (finalTranscriptRef.current) {
        setTranscript(finalTranscriptRef.current.trim());
      }
      setInterimTranscript("");

      // Auto-restart if the recognition ended unexpectedly (not manual stop)
      // and continuous mode is on. This handles Chrome's tendency to
      // stop after ~60 seconds of silence.
      if (!manualStopRef.current && continuous && finalTranscriptRef.current) {
        // Don't auto-restart — let the user decide
        // The transcript is preserved so they can submit or continue
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError("Failed to start speech recognition. Please try again.");
      setIsListening(false);
    }
  }, [isSupported, lang, continuous, interimResults]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
