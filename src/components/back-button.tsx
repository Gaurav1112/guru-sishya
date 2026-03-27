"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string; // Optional explicit destination
  label?: string; // e.g., "Back to Topic Hub" or "Back to Topics"
}

export function BackButton({ href, label = "Back" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <ArrowLeft className="size-4" />
      <span>{label}</span>
    </button>
  );
}
