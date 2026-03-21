"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ApiKeyInput() {
  const { apiKey, setApiKey } = useStore();
  const [key, setKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);
  function handleSave() { setApiKey(key.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  const isValid = key.trim().startsWith("sk-ant-");
  return (
    <div className="space-y-2">
      <Label htmlFor="api-key">Claude API Key</Label>
      <div className="flex gap-2">
        <Input id="api-key" type="password" value={key} onChange={(e) => { setKey(e.target.value); setSaved(false); }} placeholder="sk-ant-api03-..." className="bg-surface font-mono text-sm" />
        <Button onClick={handleSave} disabled={!key.trim() || saved} className={saved ? "bg-teal" : "bg-saffron hover:bg-saffron/90"}>{saved ? "Saved" : "Save"}</Button>
        {apiKey && (
          <Button variant="outline" onClick={() => { setApiKey(""); setKey(""); }} className="text-destructive border-destructive/30 hover:bg-destructive/10">Remove</Button>
        )}
      </div>
      {key && !isValid && <p className="text-xs text-destructive">API key should start with &quot;sk-ant-&quot;</p>}
      <p className="text-xs text-muted-foreground">Your API key is stored locally in your browser. It is never sent to our servers.</p>
    </div>
  );
}
