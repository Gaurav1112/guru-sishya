"use client";

import { ExternalLink, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CuratedResource } from "@/lib/resources/types";

interface ResourceCardProps {
  resource: CuratedResource;
}

const confidenceConfig = {
  HIGH: {
    dot: "bg-teal",
    label: "Verified",
    textClass: "text-teal",
    borderClass: "border-teal/20",
  },
  MEDIUM: {
    dot: "bg-gold",
    label: "Likely accurate",
    textClass: "text-gold",
    borderClass: "border-gold/20",
  },
  LOW: {
    dot: "bg-saffron",
    label: "Unverified — please verify",
    textClass: "text-saffron",
    borderClass: "border-saffron/20",
  },
};

const categoryColors: Record<string, string> = {
  books: "bg-indigo/20 text-indigo border-indigo/30",
  courses: "bg-saffron/20 text-saffron border-saffron/30",
  youtube: "bg-destructive/20 text-destructive border-destructive/30",
  interactive: "bg-teal/20 text-teal border-teal/30",
  docs: "bg-muted text-muted-foreground border-border",
  communities: "bg-gold/20 text-gold border-gold/30",
  blogs: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  podcasts: "bg-accent/20 text-accent border-accent/30",
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const conf = confidenceConfig[resource.confidence];
  const catColor = categoryColors[resource.category] ?? "bg-muted text-muted-foreground border-border";

  return (
    <Card className={cn("bg-surface h-full", conf.borderClass, "border")}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2 justify-between">
          <div className="flex-1 min-w-0">
            {resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-heading font-semibold text-sm hover:text-saffron transition-colors flex items-center gap-1 group"
              >
                <span>{resource.title}</span>
                <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <span className="font-heading font-semibold text-sm">{resource.title}</span>
            )}
            {resource.author && (
              <p className="text-xs text-muted-foreground mt-0.5">by {resource.author}</p>
            )}
          </div>
          <Badge className={cn("text-xs shrink-0 border", catColor)} variant="outline">
            {resource.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {/* Justification */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {resource.justification}
        </p>

        {/* Pareto chapters */}
        {resource.paretoChapters && (
          <div className="flex items-start gap-1.5 rounded-lg bg-gold/10 border border-gold/20 p-2">
            <BookOpen className="size-3 text-gold mt-0.5 shrink-0" />
            <p className="text-xs text-gold">{resource.paretoChapters}</p>
          </div>
        )}

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            Best for: {resource.bestFor}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {resource.estimatedTime}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              resource.cost.toLowerCase().includes("free")
                ? "border-teal/30 text-teal"
                : "border-muted-foreground/30"
            )}
          >
            {resource.cost}
          </Badge>
        </div>

        {/* Confidence indicator */}
        <div className={cn("flex items-center gap-1.5 text-xs", conf.textClass)}>
          <div className={cn("size-1.5 rounded-full shrink-0", conf.dot)} />
          <span>{conf.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
