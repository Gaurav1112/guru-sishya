#!/usr/bin/env python3
"""Verify content was added correctly and report summary."""
import json
import subprocess

PATH = "/Users/racit/PersonalProject/guru-sishya/public/content/core-cs.json"

with open(PATH) as f:
    data = json.load(f)

print("=== Content Verification ===")
total = 0
ok = 0
issues = []

topic_ids = ["javascript-fundamentals", "typescript", "react", "nodejs", "python"]
for topic_id in topic_ids:
    topic = next(d for d in data if d["id"] == topic_id)
    sessions = topic["plan"]["sessions"]
    print(f"\n{topic['name']}: {len(sessions)} sessions")
    for s in sessions:
        total += 1
        c = s.get("content", "")
        clen = len(c)
        words = len(c.split()) if c else 0
        if clen >= 800:
            ok += 1
            print(f"  [{s['sessionNumber']:2d}] OK  {clen:6d} chars  ~{words:4d} words  {s['title'][:50]}")
        else:
            issues.append(f"  [{s['sessionNumber']:2d}] FAIL {clen:6d} chars  {s['title'][:50]}")
            print(f"  [{s['sessionNumber']:2d}] FAIL {clen:6d} chars  {s['title'][:50]}")

print(f"\n=== Summary: {ok}/{total} sessions OK ===")
if issues:
    print("Issues:")
    for i in issues: print(i)
else:
    print("All sessions have 800+ chars of content!")

# Git commit
print("\n=== Creating Git Commit ===")
result = subprocess.run(
    ["git", "-C", "/Users/racit/PersonalProject/guru-sishya", "add",
     "public/content/core-cs.json"],
    capture_output=True, text=True
)
print("git add:", result.returncode, result.stderr or "OK")

result = subprocess.run(
    ["git", "-C", "/Users/racit/PersonalProject/guru-sishya", "commit", "-m",
     "content: add full lessons for Core CS topics 1-5\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"],
    capture_output=True, text=True
)
print("git commit:", result.returncode)
print(result.stdout)
if result.stderr:
    print("stderr:", result.stderr)
