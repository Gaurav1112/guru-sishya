# Content Scripts

## regenerate-stubs.ts

Scans all content JSON files for sessions with placeholder/stub code and regenerates them using Claude API.

### Usage

```bash
# Dry run — list stubs without regenerating
npx tsx scripts/regenerate-stubs.ts --dry-run

# Regenerate all stubs
ANTHROPIC_API_KEY=sk-... npx tsx scripts/regenerate-stubs.ts

# Regenerate only a specific file
ANTHROPIC_API_KEY=sk-... npx tsx scripts/regenerate-stubs.ts --file=core-cs.json

# Regenerate at most 5 sessions
ANTHROPIC_API_KEY=sk-... npx tsx scripts/regenerate-stubs.ts --limit=5
```

### Cost Estimate
- ~75 stub sessions x ~3000 tokens per generation = ~225K output tokens
- Claude Sonnet: ~$0.75 per 225K output tokens
- Total estimated cost: **~$1-2**
