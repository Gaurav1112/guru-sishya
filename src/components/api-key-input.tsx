"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AIProviderType } from "@/lib/stores/settings-slice";

const PROVIDER_CONFIG: Record<
  AIProviderType,
  { label: string; placeholder: string; helpText: string; validatePrefix?: string }
> = {
  gemini: {
    label: "Gemini API Key (Free)",
    placeholder: "AIza...",
    helpText: "Get a FREE key at aistudio.google.com → Get API Key. No credit card needed.",
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
        <div className="flex gap-2">
          <Button
            variant={aiProvider === "gemini" ? "default" : "outline"}
            size="sm"
            onClick={() => setAIProvider("gemini")}
            className={aiProvider === "gemini" ? "bg-saffron" : ""}
          >
            Gemini (Free)
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

      {/* API key input */}
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
    </div>
  );
}
