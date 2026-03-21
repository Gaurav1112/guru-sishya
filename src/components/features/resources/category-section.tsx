"use client";

import { ResourceCard } from "./resource-card";
import type { CuratedResource } from "@/lib/resources/types";

interface CategorySectionProps {
  name: string;
  icon: string;
  items: CuratedResource[];
}

export function CategorySection({ name, icon, items }: CategorySectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wide">
          {name}
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {items.length} resource{items.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <ResourceCard key={`${item.title}-${i}`} resource={item} />
        ))}
      </div>
    </div>
  );
}
