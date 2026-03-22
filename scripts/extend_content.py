#!/usr/bin/env python3
"""Extend short sessions by appending extra content loaded from JSON files."""

import json
import os

BASE = "/Users/racit/PersonalProject/guru-sishya"
FILE = os.path.join(BASE, "public/content/system-design-fundamentals.json")

def load_json(path):
    with open(path) as f:
        return json.load(f)

data = load_json(FILE)

ds_index = next(i for i, d in enumerate(data) if d.get("topic") == "Distributed Systems Fundamentals")
sp_index = next(i for i, d in enumerate(data) if d.get("topic") == "Scalability Patterns")

extensions = load_json(os.path.join(BASE, "scripts/extensions.json"))

for ext in extensions:
    topic_idx = ds_index if ext["topic"] == "ds" else sp_index
    snum_target = ext["session"]
    sessions = data[topic_idx]["plan"]["sessions"]
    for s in sessions:
        snum = s.get("sessionNumber") or s.get("session")
        if snum == snum_target and s.get("content"):
            s["content"] = s["content"] + ext["append"]
            break

with open(FILE, "w") as f:
    json.dump(data, f, separators=(",", ":"))
    f.write("\n")

print("Extensions applied. Verifying word counts...\n")

verify = load_json(FILE)
ds = verify[ds_index]
sp = verify[sp_index]
all_ok = True

print("=== Distributed Systems Fundamentals ===")
for s in ds["plan"]["sessions"]:
    content = s.get("content", "")
    snum = s.get("sessionNumber", s.get("session", "?"))
    wc = len(content.split()) if content else 0
    ok = wc >= 800
    if not ok:
        all_ok = False
    status = "OK" if ok else "SHORT"
    print(f"  Session {snum:2}: {wc:5} words [{status}]")

print("\n=== Scalability Patterns ===")
for s in sp["plan"]["sessions"]:
    content = s.get("content", "")
    snum = s.get("sessionNumber", s.get("session", "?"))
    wc = len(content.split()) if content else 0
    ok = wc >= 800
    if not ok:
        all_ok = False
    status = "OK" if ok else "SHORT"
    print(f"  Session {snum:2}: {wc:5} words [{status}]")

print(f"\nAll sessions >= 800 words: {all_ok}")
