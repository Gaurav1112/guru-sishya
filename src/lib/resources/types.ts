// ────────────────────────────────────────────────────────────────────────────
// Resource finder types
// ────────────────────────────────────────────────────────────────────────────

export interface CuratedResource {
  title: string;
  author: string;
  category:
    | "books"
    | "courses"
    | "youtube"
    | "interactive"
    | "docs"
    | "communities"
    | "blogs"
    | "podcasts";
  justification: string;
  bestFor: string;
  estimatedTime: string;
  cost: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  url?: string;
  paretoChapters?: string;
}

export interface ResourceCollection {
  topic: string;
  categories: {
    name: string;
    icon: string;
    items: CuratedResource[];
  }[];
}
