#!/usr/bin/env python3
import json, sys

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json') as f:
    data = json.load(f)

print('Total topics:', len(data))
for i, topic in enumerate(data[:6]):
    sessions = topic.get('sessions', [])
    print(f'\n=== {i}: {topic["topic"]} ===')
    print(f'  Keys: {list(topic.keys())}')
    print(f'  Sessions: {len(sessions)}')
    for j, s in enumerate(sessions[:3]):
        print(f'  Session {j}: keys={list(s.keys())} title={s.get("title","?")}')
        content = s.get('content', '')
        print(f'    content length: {len(content)}')
