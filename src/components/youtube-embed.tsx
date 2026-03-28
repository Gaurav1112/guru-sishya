"use client";

import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import type { YouTubeVideo } from "@/lib/content/youtube-videos";

interface Props {
  videos: YouTubeVideo[];
}

export function YouTubeVideos({ videos }: Props) {
  if (videos.length === 0) return null;

  return (
    <section>
      <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="text-red-500">&#9654;</span>
        Video Resources
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {videos.map((v) => (
          <div
            key={v.videoId}
            className="rounded-xl border border-border/50 bg-surface overflow-hidden"
          >
            <div className="aspect-video">
              <LiteYouTubeEmbed
                id={v.videoId}
                title={v.title}
                poster="hqdefault"
                webp
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium leading-snug">{v.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{v.channel}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
