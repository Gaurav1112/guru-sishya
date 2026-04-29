"use client";

import { useState } from "react";
import { Share2, Copy, Check, Download, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type ShareType = "streak" | "badge" | "mastery" | "stats" | "quiz";

export interface ShareButtonProps {
  /** The achievement type — drives which OG card is rendered */
  type: ShareType;
  /** Numeric value (streak count, score, topic count, etc.) */
  value?: string | number;
  /** Name label (topic name, badge name, etc.) */
  name?: string;
  /** Optional custom share text for social posts */
  shareText?: string;
  /** Optional CSS class for the trigger button */
  className?: string;
  /** Button size variant */
  size?: "default" | "sm" | "lg" | "icon";
  /** Show icon only (no label text) */
  iconOnly?: boolean;
}

// ── URL builder ────────────────────────────────────────────────────────────

function buildOgUrl(
  type: ShareType,
  value?: string | number,
  name?: string
): string {
  const params = new URLSearchParams({ type });
  if (value !== undefined) params.set("value", String(value));
  if (name) params.set("name", name);
  // Use absolute URL so it works in share dialogs
  const base =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";
  return `${base}/api/og?${params.toString()}`;
}

const APP_URL = "https://www.guru-sishya.in";

function buildShareUrl(
  type: ShareType,
  value?: string | number,
  name?: string
): string {
  return APP_URL;
}

function buildShareText(
  type: ShareType,
  value?: string | number,
  name?: string,
  custom?: string
): string {
  if (custom) return custom;
  switch (type) {
    case "streak":
      return `${value}-day learning streak on Guru Sishya! #ConsistencyIsKey #InterviewPrep #GuruSishya`;
    case "badge":
      return `I just earned the ${name} badge on Guru Sishya! #InterviewPrep #GuruSishya`;
    case "mastery":
      return `Just mastered "${name}" on Guru Sishya. Deep understanding, not just memorisation! #CodingInterview #GuruSishya`;
    case "stats":
      return `I've explored ${value} topics on Guru Sishya! #InterviewPrep #GuruSishya`;
    case "quiz":
      return `Scored ${value}% on ${name} Quiz on Guru Sishya! #CodingInterview #GuruSishya`;
    default:
      return "Check out my progress on Guru Sishya - the AI-powered SWE interview prep app! #InterviewPrep #GuruSishya";
  }
}

// ── Download helper ────────────────────────────────────────────────────────

async function downloadOgImage(ogUrl: string, filename: string): Promise<void> {
  const res = await fetch(ogUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Dropdown menu ──────────────────────────────────────────────────────────

interface ShareMenuProps {
  ogUrl: string;
  shareUrl: string;
  text: string;
  filename: string;
  onClose: () => void;
}

function ShareMenu({ ogUrl, shareUrl, text, filename, onClose }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard API not available or permission denied — ignore
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  }

  function handleTwitter() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  function handleLinkedin() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  function handleWhatsapp() {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    onClose();
  }

  async function handleDownload() {
    await downloadOgImage(ogUrl, filename);
    onClose();
  }

  return (
    <div
      className="absolute right-0 bottom-full mb-2 z-50 w-52 rounded-xl border border-border/60 bg-surface shadow-xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        <button
          onClick={handleCopy}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
        >
          {copied ? (
            <Check className="size-4 text-teal" />
          ) : (
            <Copy className="size-4 text-muted-foreground" />
          )}
          <span>{copied ? "Copied!" : "Copy link"}</span>
        </button>

        <button
          onClick={handleTwitter}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
        >
          <Twitter className="size-4 text-muted-foreground" />
          <span>Share on X</span>
        </button>

        <button
          onClick={handleLinkedin}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
        >
          <Linkedin className="size-4 text-muted-foreground" />
          <span>Share on LinkedIn</span>
        </button>

        <button
          onClick={handleWhatsapp}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
        >
          {/* WhatsApp icon (inline SVG — not in lucide) */}
          <svg
            className="size-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span>Share on WhatsApp</span>
        </button>

        <div className="my-1 border-t border-border/40" />

        <button
          onClick={handleDownload}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
        >
          <Download className="size-4 text-muted-foreground" />
          <span>Download image</span>
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ShareButton({
  type,
  value,
  name,
  shareText,
  className,
  size = "sm",
  iconOnly = false,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  const ogUrl = buildOgUrl(type, value, name);
  const shareUrl = buildShareUrl(type, value, name);
  const text = buildShareText(type, value, name, shareText);
  const filename = `guru-sishya-${type}${value ? `-${value}` : ""}.png`;

  async function handleClick() {
    // Prefer Web Share API on mobile/supported platforms
    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      navigator.canShare?.({ url: shareUrl })
    ) {
      try {
        await navigator.share({
          title: "Guru Sishya Achievement",
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to custom menu
      }
    }
    setOpen((prev) => !prev);
  }

  return (
    <div className={cn("relative inline-flex", className)}>
      <Button
        variant="outline"
        size={size}
        onClick={handleClick}
        aria-label="Share achievement"
        aria-expanded={open}
      >
        <Share2 className="size-4" />
        {!iconOnly && <span className="ml-1.5">Share</span>}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <ShareMenu
            ogUrl={ogUrl}
            shareUrl={shareUrl}
            text={text}
            filename={filename}
            onClose={() => setOpen(false)}
          />
        </>
      )}
    </div>
  );
}
