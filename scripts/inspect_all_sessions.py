#!/usr/bin/env python3
import json

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json') as f:
    data = json.load(f)

for i in range(5):
    topic = data[i]
    sessions = topic['plan']['sessions']
    print(f"\n=== {topic['topic']} ({len(sessions)} sessions) ===")
    for s in sessions:
        print(f"  {s['session']}. {s['title']} ({s.get('duration','?')})")
