# AI Video Pipeline — Design Spec

**Date**: 2026-03-28
**Project**: Separate standalone project (not inside Guru Sishya codebase)
**Goal**: Automated pipeline that generates human-like teaching videos from text content and publishes daily to YouTube + Instagram
**Budget**: Under $10/month running cost

---

## Problem Statement

Guru Sishya has 53 topics with 671 sessions of rich lesson content (markdown with code blocks, mermaid diagrams, tables). Each session needs a professional teaching video that:
- Looks human-made and natural (Fireship/3Blue1Brown style, not robotic)
- Shows code with syntax highlighting and line-by-line animation
- Renders architecture diagrams
- Has natural-sounding voice narration
- Auto-publishes daily to YouTube (long format) and Instagram Reels (short format)

---

## Architecture

```
[Content Source]                    [Video Generation Service]
  guru-sishya/                       video-pipeline/
  public/content/*.json    --->      src/
                                       pipeline/
                                         script-generator.ts    # content -> narration script
                                         tts-engine.ts          # script -> audio (Kokoro TTS)
                                         storyboard.ts          # script + audio -> scene data
                                       remotion/
                                         compositions/
                                           LongVideo.tsx        # 16:9 YouTube (5-12 min)
                                           ShortVideo.tsx        # 9:16 Reels/Shorts (30-90 sec)
                                           Thumbnail.tsx         # 1280x720 still frame
                                         components/
                                           TitleSlide.tsx
                                           CodeReveal.tsx        # Syntax-highlighted, line-animated
                                           DiagramSlide.tsx      # Mermaid SVG animation
                                           ComparisonTable.tsx
                                           TextSection.tsx
                                           InterviewInsight.tsx
                                           SummarySlide.tsx
                                       render/
                                         batch-render.ts        # Renders all videos
                                         upload-r2.ts           # Uploads to Cloudflare R2
                                       n8n/
                                         daily-publish.json     # n8n workflow export

[Publishing Pipeline (n8n)]
  Daily Cron (08:00 UTC)
    -> Pick next topic from queue
    -> Upload long video to YouTube (scheduled)
    -> Upload short video as Instagram Reel
    -> Log to tracking sheet
```

---

## Tech Stack

| Component | Technology | Cost |
|-----------|-----------|------|
| Video Framework | Remotion v4+ (React) | Free (team <3) |
| Video Template | remotion-fireship (fork/customize) | Free (MIT) |
| TTS (primary) | Kokoro 82M via Kokoro-FastAPI Docker | Free (Apache 2.0) |
| TTS (fallback) | Edge TTS (Microsoft, Python) | Free |
| Code Highlighting | Shiki (React) | Free |
| Diagram Rendering | Mermaid CLI -> SVG | Free |
| Publishing Automation | n8n Community Edition (self-hosted) | Free |
| YouTube Upload | YouTube Data API v3 | Free (6 uploads/day quota) |
| Instagram Upload | Facebook Graph API (Reels) | Free |
| Video Hosting | Cloudflare R2 (free egress) | ~$2/month |
| VPS | Hetzner CX22 (2 vCPU, 4GB RAM) | ~$8/month |
| Queue/Tracking | SQLite or Google Sheets | Free |
| **Total Monthly** | | **~$10/month** |
| **Total One-Time** | | **~$15 (storage during bulk gen)** |

---

## Video Formats

| Output | Platform | Aspect | Duration | Content |
|--------|----------|--------|----------|---------|
| Long | YouTube | 16:9 (1920x1080) | 5-12 min | Full lesson with code walkthrough |
| Short | YouTube Shorts + Instagram Reels | 9:16 (1080x1920) | 30-90 sec | Key concept + "Full video on YouTube" CTA |
| Thumbnail | YouTube | 16:9 (1280x720) | Still frame | Topic title + code snippet + category badge |

Both rendered from the SAME Remotion composition with different props/layout.

---

## Pipeline Flow (Per Video)

### Step 1: Parse Content -> Script

Input: Session JSON from `public/content/*.json`

```typescript
interface SessionInput {
  topic: string;
  sessionNumber: number;
  title: string;
  content: string; // markdown with code blocks, diagrams, tables
  objectives: string[];
  reviewQuestions: string[];
}
```

The script generator splits content into typed scenes:

```typescript
interface Scene {
  type: "title" | "text" | "code" | "diagram" | "table" | "interview" | "summary";
  content: string;
  narration: string; // spoken version of the content
  language?: string; // for code scenes
  duration?: number; // estimated seconds
}
```

### Step 2: Generate TTS Audio

For each scene's narration text:
- Call Kokoro TTS (self-hosted Docker) via OpenAI-compatible API
- Get back: MP3 audio + word-level timestamps
- Kokoro generates at 90x realtime on GPU (~6 seconds for 10 min of audio)

### Step 3: Generate Storyboard

Map scenes to Remotion compositions with frame timings:

```typescript
interface Storyboard {
  fps: 30;
  width: 1920;
  height: 1080;
  scenes: {
    component: string; // "CodeReveal" | "TextSection" | etc.
    startFrame: number;
    endFrame: number;
    props: Record<string, any>;
    audioFile: string;
  }[];
}
```

### Step 4: Render with Remotion

- Long video: full storyboard, 16:9
- Short video: first 2-3 scenes only (concept + one code example), 9:16
- Thumbnail: single frame from title slide, 1280x720

Rendering: ~2-3 min per video on local machine with GPU.

### Step 5: Upload to R2

All rendered files uploaded to Cloudflare R2 bucket with public URLs.

### Step 6: Publish via n8n

Daily cron workflow:
1. Pick next unpublished topic from queue
2. YouTube: `videos.insert` (private + scheduledAt) + `thumbnails.set`
3. Instagram: Create REELS container from R2 URL -> wait 90s -> publish
4. Mark as published, log to sheet, notify Discord

---

## Remotion Components (Dark Scholar Theme)

All components match Guru Sishya's visual identity:
- Background: #0C0A15 (dark)
- Accent: #E85D26 (saffron) for headings
- Code: Teal highlights
- Insights: Gold callout cards
- Font: JetBrains Mono (code), Inter (text)

### Components to Build

1. **TitleSlide** — Topic name, session number, objectives fade in
2. **CodeReveal** — Shiki-highlighted code, lines appear one by one, optional line highlight callout
3. **DiagramSlide** — Mermaid SVG with progressive node/edge animation
4. **ComparisonTable** — Rows fade in sequentially
5. **TextSection** — Heading + bullet points with stagger
6. **InterviewInsight** — Gold-bordered callout card slides in
7. **ReviewQuestion** — Question appears, pause, answer reveals
8. **SummarySlide** — Key takeaways card
9. **ProgressBar** — Bottom bar showing video progress
10. **TopicHeader** — Persistent header with topic + session info
11. **Thumbnail** — Still frame component for YouTube thumbnail

---

## n8n Workflow: daily-video-publish

```
Trigger: Cron (daily 08:00 UTC)
  |
  v
HTTP Request: GET /api/queue/next (get next unpublished topic)
  |
  v
IF: topic exists? (stop if queue empty)
  |
  v
HTTP Request: POST /api/render (trigger video generation)
  |  Returns: { longUrl, shortUrl, thumbUrl, title, description, tags }
  v
Wait: Poll /api/render/status until complete (~3-10 min)
  |
  v
HTTP Request: YouTube videos.insert
  |  - video: longUrl
  |  - title, description, tags
  |  - publishAt: scheduled time
  |  - categoryId: 27 (Education)
  v
HTTP Request: YouTube thumbnails.set
  |
  v
HTTP Request: Instagram /media (create REELS container)
  |  - video_url: shortUrl (R2 signed URL)
  |  - caption: generated caption with hashtags
  v
Wait: 90 seconds (Instagram processing)
  |
  v
HTTP Request: Instagram /media_publish
  |
  v
HTTP Request: Update queue (mark published, store video IDs)
  |
  v
Discord Webhook: "Published: {title} — YT: {url} / IG: {url}"
```

---

## Cost Breakdown (671 Videos)

### One-Time Generation

| Item | Cost |
|------|------|
| Kokoro TTS (self-hosted) | $0 |
| Remotion rendering (local) | $0 (electricity ~$5) |
| Remotion rendering (Lambda alternative) | ~$10 |
| Cloudflare R2 storage (671 long + 671 short = ~100GB) | $1.35/month |
| **Total** | **~$5-15** |

### Monthly Running

| Item | Cost |
|------|------|
| Hetzner VPS (n8n + Kokoro Docker) | $8 |
| Cloudflare R2 storage | $2 |
| YouTube API | Free |
| Instagram API | Free |
| n8n Community | Free |
| **Total** | **~$10/month** |

---

## Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Visual quality | 9/10 | React components with animations — sharp, modern |
| Voice naturalness | 8/10 | Kokoro #1 on TTS Arena, clear teacher voice |
| Code presentation | 10/10 | Syntax highlighted, line-by-line animation |
| Diagram quality | 9/10 | Mermaid SVGs with progressive reveal |
| Overall "human feel" | 8/10 | Fireship-style — no face but highly professional |
| Automation | 10/10 | 100% automated after setup |

---

## Implementation Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Project setup + Remotion | Day 1-3 | Fork remotion-fireship, set up project |
| 2. Build 11 video components | Day 3-7 | TitleSlide through Thumbnail |
| 3. Script generator + TTS pipeline | Day 7-10 | Content -> narration -> audio |
| 4. Storyboard generator | Day 10-12 | Scenes + audio -> Remotion composition |
| 5. Test with 5 pilot videos | Day 12-14 | Validate quality, iterate |
| 6. n8n publishing workflow | Day 14-16 | YouTube + Instagram automation |
| 7. Batch render all 671 | Day 16-19 | All videos generated |
| **First video published** | **~2 weeks** | |
| **All 671 done** | **~3 weeks** | |

---

## Project Structure

```
video-pipeline/
  package.json
  remotion.config.ts
  src/
    compositions/
      LongVideo.tsx
      ShortVideo.tsx
      Thumbnail.tsx
    components/
      TitleSlide.tsx
      CodeReveal.tsx
      DiagramSlide.tsx
      ComparisonTable.tsx
      TextSection.tsx
      InterviewInsight.tsx
      ReviewQuestion.tsx
      SummarySlide.tsx
      ProgressBar.tsx
      TopicHeader.tsx
    pipeline/
      script-generator.ts
      tts-engine.ts
      storyboard.ts
    render/
      batch-render.ts
      upload-r2.ts
    api/
      server.ts          # Simple Express API for n8n to call
      routes/
        queue.ts          # GET /api/queue/next, POST /api/queue/complete
        render.ts         # POST /api/render, GET /api/render/status
    n8n/
      daily-publish.json  # Exportable n8n workflow
  content/               # Symlink or copy from guru-sishya/public/content/
  output/                # Rendered videos
  docker-compose.yml     # Kokoro TTS + n8n + API server
  Dockerfile
  README.md
```

---

## Dependencies

```json
{
  "dependencies": {
    "remotion": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/lambda": "^4.0.0",
    "shiki": "^1.0.0",
    "express": "^4.18.0",
    "@aws-sdk/client-s3": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

Docker services:
- `kokoro-tts`: Kokoro-FastAPI (GPU or CPU mode)
- `n8n`: n8n Community Edition
- `api`: Express server for render API

---

## Future Enhancements

1. **AI Avatar PiP** — Add small talking-head in corner using D-ID ($0.05/min) once revenue justifies
2. **Multi-language** — Hindi narration using Kokoro's Hindi voice
3. **Interactive quizzes in video** — YouTube end-screen cards linking to quiz
4. **A/B testing thumbnails** — Generate 3 variants, test which gets more clicks
5. **Automatic content updates** — When session content changes, re-render and re-upload

---

## Constraints

- Zero API cost for video generation (all self-hosted)
- Must work on a $8/month VPS for daily publishing
- Local machine (Mac/Linux) for bulk rendering
- YouTube daily upload limit: 6 videos (more than enough for 1/day)
- Instagram Reels: 1/day max recommended
- All git commits local only unless explicitly asked to push
