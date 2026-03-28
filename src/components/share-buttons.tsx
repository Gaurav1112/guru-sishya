"use client";

import { useState } from "react";
import { Copy, Check, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ShareButtonsProps {
  /** The URL to share */
  shareUrl: string;
  /** The pre-composed share text (without URL) */
  shareText: string;
  /** Optional extra CSS class on the wrapper */
  className?: string;
}

// ── WhatsApp icon (not in lucide) ──────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

/**
 * ShareButtons - inline share buttons for WhatsApp, X, LinkedIn, and Copy Link.
 *
 * Designed to be embedded inside result screens and challenge pages.
 * No dropdown - buttons are always visible and clearly labelled.
 */
export function ShareButtons({ shareUrl, shareText, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullText = `${shareText} ${shareUrl}`;

  function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleTwitter() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleLinkedIn() {
    const text = `${shareText} ${shareUrl}`;
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* WhatsApp */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleWhatsApp}
        className="flex items-center gap-1.5 border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 hover:border-[#25D366]/60"
        aria-label="Share on WhatsApp"
      >
        <WhatsAppIcon className="size-3.5" />
        <span>WhatsApp</span>
      </Button>

      {/* X / Twitter */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTwitter}
        className="flex items-center gap-1.5 border-foreground/20 bg-foreground/5 text-foreground hover:bg-foreground/10 hover:border-foreground/30"
        aria-label="Share on X"
      >
        <Twitter className="size-3.5" />
        <span>X</span>
      </Button>

      {/* LinkedIn */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLinkedIn}
        className="flex items-center gap-1.5 border-[#0A66C2]/40 bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/60"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="size-3.5" />
        <span>LinkedIn</span>
      </Button>

      {/* Copy Link */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          copied
            ? "border-teal/40 bg-teal/10 text-teal"
            : "border-border text-muted-foreground hover:text-foreground"
        )}
        aria-label="Copy link to clipboard"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        <span>{copied ? "Copied!" : "Copy Link"}</span>
      </Button>
    </div>
  );
}
