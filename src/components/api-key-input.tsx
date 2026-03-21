"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AIProviderType } from "@/lib/stores/settings-slice";

const PROVIDER_CONFIG: Record<
  AIProviderType,
  { label: string; placeholder: string; helpText: string; validatePrefix?: string; noKeyNeeded?: boolean }
> = {
  ollama: {
    label: "Ollama (Local, Free, No Key)",
    placeholder: "",
    helpText: "Runs AI models locally on your computer. Install Ollama from ollama.com/download, then run: ollama pull llama3.2",
    noKeyNeeded: true,
  },
  gemini: {
    label: "Gemini API Key (Free)",
    placeholder: "AIza...",
    helpText: "Get a FREE key at aistudio.google.com — Get API Key. No credit card needed.",
  },
  groq: {
    label: "Groq API Key (Free)",
    placeholder: "gsk_...",
    helpText: "Get a FREE key at console.groq.com. Runs Llama 3.3 70B. Note: may have CORS limitations in browser.",
    validatePrefix: "gsk_",
  },
  openrouter: {
    label: "OpenRouter API Key (Free)",
    placeholder: "sk-or-...",
    helpText: "Get a FREE key at openrouter.ai. CORS-friendly, runs Gemini 2.0 Flash free. Recommended fallback.",
    validatePrefix: "sk-or-",
  },
  claude: {
    label: "Claude API Key (Paid)",
    placeholder: "sk-ant-api03-...",
    helpText: "Get a key at console.anthropic.com. Requires API credits.",
    validatePrefix: "sk-ant-",
  },
};

export function ApiKeyInput() {
  const apiKey = useStore((s) => s.apiKey);
  const setApiKey = useStore((s) => s.setApiKey);
  const aiProvider = useStore((s) => s.aiProvider);
  const setAIProvider = useStore((s) => s.setAIProvider);

  const [key, setKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const config = PROVIDER_CONFIG[aiProvider];

  // Reset key input when provider changes
  useEffect(() => {
    setKey(apiKey);
  }, [aiProvider, apiKey]);

  function handleSave() {
    setApiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleRemove() {
    setApiKey("");
    setKey("");
  }

  const hasValidationPrefix = config.validatePrefix;
  const isInvalid =
    key.trim() &&
    hasValidationPrefix &&
    !key.trim().startsWith(hasValidationPrefix);

  return (
    <div className="space-y-4">
      {/* Provider selector */}
      <div>
        <Label className="mb-2 block">AI Provider</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={aiProvider === "ollama" ? "default" : "outline"}
            size="sm"
            onClick={() => setAIProvider("ollama")}
            className={aiProvider === "ollama" ? "bg-teal" : ""}
          >
            Ollama (Local, Free)
          </Button>
          <Button
            variant={aiProvider === "gemini" ? "default" : "outline"}
            size="sm"
            onClick={() => setAIProvider("gemini")}
            className={aiProvider === "gemini" ? "bg-saffron" : ""}
          >
            Gemini (Free)
          </Button>
          <Button
            variant={aiProvider === "groq" ? "default" : "outline"}
            size="sm"
            onClick={() => setAIProvider("groq")}
            className={aiProvider === "groq" ? "bg-saffron" : ""}
          >
            Groq (Free)
          </Button>
          <Button
            variant={aiProvider === "openrouter" ? "default" : "outline"}
            size="sm"
            onClick={() => setAIProvider("openrouter")}
            className={aiProvider === "openrouter" ? "bg-saffron" : ""}
          >
            OpenRouter (Free)
          </Button>
          <Button
            variant={aiProvider === "claude" ? "default" : "outline"}
            size="sm"
            onClick={() => setAIProvider("claude")}
            className={aiProvider === "claude" ? "bg-saffron" : ""}
          >
            Claude (Paid)
          </Button>
        </div>
      </div>

      {/* Ollama: no key needed, show setup instructions */}
      {config.noKeyNeeded ? (
        <div className="space-y-2 rounded-xl border border-teal/30 bg-teal/5 p-4">
          <p className="text-sm font-medium text-teal">No API key needed!</p>
          <p className="text-xs text-muted-foreground">{config.helpText}</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Quick setup:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Download Ollama from <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="text-teal underline">ollama.com/download</a></li>
              <li>Open Terminal and run: <code className="bg-surface px-1 rounded">ollama pull llama3.2</code></li>
              <li>Keep Ollama running and start using the app</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            Everything runs on your computer. No data leaves your machine.
          </p>
        </div>
      ) : (
        /* API key input */
        <div className="space-y-2">
          <Label htmlFor="api-key">{config.label}</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setSaved(false);
              }}
              placeholder={config.placeholder}
              className="bg-surface font-mono text-sm"
            />
            <Button
              onClick={handleSave}
              disabled={!key.trim() || saved}
              className={saved ? "bg-teal" : "bg-saffron hover:bg-saffron/90"}
            >
              {saved ? "Saved" : "Save"}
            </Button>
            {apiKey && (
              <Button
                variant="outline"
                onClick={handleRemove}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Remove
              </Button>
            )}
          </div>
          {isInvalid && (
            <p className="text-xs text-destructive">
              Key should start with &quot;{config.validatePrefix}&quot;
            </p>
          )}
          <p className="text-xs text-muted-foreground">{config.helpText}</p>
          <p className="text-xs text-muted-foreground">
            Your key is stored locally in your browser. It is never sent to our
            servers.
          </p>
        </div>
      )}
    </div>
  );
}
