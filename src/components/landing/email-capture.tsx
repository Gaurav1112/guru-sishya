"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    // Store email in localStorage for now (can be sent to backend later)
    try {
      const emails = JSON.parse(localStorage.getItem("gs-email-captures") || "[]");
      emails.push({ email: email.trim(), capturedAt: new Date().toISOString() });
      localStorage.setItem("gs-email-captures", JSON.stringify(emails));
    } catch {}

    // Simulate submit delay
    await new Promise(r => setTimeout(r, 500));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-teal text-sm">
        <CheckCircle className="size-5" />
        <span>Check your inbox for the cheatsheet!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-saffron/50"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-saffron text-background text-sm font-semibold hover:bg-saffron/90 transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Get Free Cheatsheet"}
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
