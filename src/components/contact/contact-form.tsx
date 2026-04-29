"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "billing", label: "Billing & Payments" },
  { value: "technical", label: "Technical Issue" },
  { value: "account", label: "Account Help" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "refund", label: "Refund Request" },
  { value: "other", label: "Other" },
] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setResult("success");
        setName("");
        setEmail("");
        setMessage("");
        setCategory("technical");
      } else {
        setResult("error");
      }
    } catch {
      setResult("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium mb-1.5">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/25"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/25"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-category" className="block text-sm font-medium mb-1.5">
          Category
        </label>
        <select
          id="contact-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/25"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium mb-1.5">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          rows={5}
          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/25 resize-none"
        />
      </div>

      {result === "success" && (
        <div className="rounded-lg border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">
          Your message has been sent. We will get back to you within 24 hours.
        </div>
      )}

      {result === "error" && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          Something went wrong. Please try again or email us directly at gurusishya.in@gmail.com.
        </div>
      )}

      <button
        type="submit"
        disabled={!message.trim() || !email.trim() || sending}
        className="inline-flex items-center gap-2 rounded-lg bg-saffron px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {sending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {sending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
