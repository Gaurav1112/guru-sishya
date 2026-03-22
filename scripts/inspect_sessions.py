#!/usr/bin/env python3
import json

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json') as f:
    data = json.load(f)

topic = data[0]
sessions = topic['plan']['sessions']
print(f'Total plan sessions: {len(sessions)}')
for s in sessions:
    print(f"\n  Session {s['session']}: {s['title']}")
    print(f"    duration: {s.get('duration','?')}")
    print(f"    keys: {list(s.keys())}")
    print(f"    goals: {str(s.get('goals',''))[:150]}")
