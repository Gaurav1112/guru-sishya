"use client";

import { cn } from "@/lib/utils";

type Language = "java" | "python" | "typescript" | "all";

interface CodeLanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
  className?: string;
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "all", label: "All" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "typescript", label: "TS" },
];

export function CodeLanguageToggle({ value, onChange, className }: CodeLanguageToggleProps) {
  return (
    <div className={cn("inline-flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5", className)}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.value}
          onClick={() => onChange(lang.value)}
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
            value === lang.value ? "bg-saffron text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
