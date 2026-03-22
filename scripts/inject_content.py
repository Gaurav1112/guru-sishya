#!/usr/bin/env python3
"""Inject full lesson content into Distributed Systems Fundamentals and Scalability Patterns."""

import json
import os

BASE = "/Users/racit/PersonalProject/guru-sishya"
FILE = os.path.join(BASE, "public/content/system-design-fundamentals.json")

def load_json(path):
    with open(path) as f:
        return json.load(f)

data = load_json(FILE)

# Load all content patches
ds_content = load_json(os.path.join(BASE, "scripts/ds_content.json"))
ds_extra   = load_json(os.path.join(BASE, "scripts/ds_content_extra.json"))
sp_content = load_json(os.path.join(BASE, "scripts/sp_content.json"))
sp_extra   = load_json(os.path.join(BASE, "scripts/sp_content_extra.json"))

# Merge extra into primary
ds_content.update(ds_extra)
sp_content.update(sp_extra)


def inject_sessions(data, topic_index, sessions_dict, topic_name):
    topic = data[topic_index]
    sessions = topic["plan"]["sessions"]
    injected = 0
    for session in sessions:
        snum = str(session.get("session") or session.get("sessionNumber", ""))
        if snum in sessions_dict:
            overrides = sessions_dict[snum]
            for k, v in overrides.items():
                session[k] = v
            injected += 1
    total = len(sessions)
    has_content = sum(1 for s in sessions if s.get("content"))
    print(f"[{topic_name}] Injected {injected} sessions, {has_content}/{total} now have content")
    return injected


ds_index = next(i for i, d in enumerate(data) if d.get("topic") == "Distributed Systems Fundamentals")
sp_index = next(i for i, d in enumerate(data) if d.get("topic") == "Scalability Patterns")

print(f"DS Fundamentals at index {ds_index}")
print(f"Scalability Patterns at index {sp_index}")

inject_sessions(data, ds_index, ds_content, "Distributed Systems Fundamentals")
inject_sessions(data, sp_index, sp_content, "Scalability Patterns")

with open(FILE, "w") as f:
    json.dump(data, f, separators=(",", ":"))
    f.write("\n")

print("\nFile written. Verifying...")

verify = load_json(FILE)
ds = verify[ds_index]
sp = verify[sp_index]

print("\n=== Distributed Systems Fundamentals ===")
for s in ds["plan"]["sessions"]:
    content = s.get("content", "")
    snum = s.get("sessionNumber", s.get("session", "?"))
    if content:
        wc = len(content.split())
        status = "OK" if wc >= 800 else f"SHORT ({wc} words)"
        print(f"  Session {snum:2}: {wc:5} words — {status}")
    else:
        print(f"  Session {snum:2}: NO CONTENT")

print("\n=== Scalability Patterns ===")
for s in sp["plan"]["sessions"]:
    content = s.get("content", "")
    snum = s.get("sessionNumber", s.get("session", "?"))
    if content:
        wc = len(content.split())
        status = "OK" if wc >= 800 else f"SHORT ({wc} words)"
        print(f"  Session {snum:2}: {wc:5} words — {status}")
    else:
        print(f"  Session {snum:2}: NO CONTENT")
