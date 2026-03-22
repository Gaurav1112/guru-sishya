#!/usr/bin/env python3
import json

with open('/Users/racit/PersonalProject/guru-sishya/public/content/system-design-cases.json') as f:
    data = json.load(f)

# Print plan and ladder structure for first topic
topic = data[0]
print('=== plan ===')
plan = topic.get('plan', {})
print(type(plan))
if isinstance(plan, dict):
    print('plan keys:', list(plan.keys()))
    for k, v in plan.items():
        print(f'  {k}: {type(v)} -> {str(v)[:200]}')
elif isinstance(plan, list):
    print('plan is list, len=', len(plan))
    for i, item in enumerate(plan[:5]):
        print(f'  [{i}] {type(item)}: {str(item)[:300]}')

print('\n=== ladder ===')
ladder = topic.get('ladder', {})
print(type(ladder))
if isinstance(ladder, dict):
    print('ladder keys:', list(ladder.keys()))
    for k, v in ladder.items():
        print(f'  {k}: {type(v)} -> {str(v)[:200]}')
elif isinstance(ladder, list):
    print('ladder is list, len=', len(ladder))
    for i, item in enumerate(ladder[:5]):
        print(f'  [{i}] {type(item)}: {str(item)[:300]}')
