import re
with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all [ and ] and their surroundings (50 chars each side)
# We look for [ and ] that are NOT part of JSON or JS
# Simple heuristic: look for tags around them
matches = []
for m in re.finditer(r'\[|\]', html):
    # Only search in body
    if m.start() < html.find('<body'): continue
    context = html[max(0, m.start()-40):min(len(html), m.end()+40)]
    matches.append(context)

for i, m in enumerate(matches[:100]):
    print(f"Match {i}: {m}")
