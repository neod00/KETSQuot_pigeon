import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's search for "해당 프로젝트는" in the whole content to find it
print("Searching for '해당 프로젝트는'...")
for match in re.finditer(r'해당.*?프로젝트는', content):
    print(f"Found at {match.start()}: {content[match.start():match.start()+100]}")

# Let's search for "SIGNED by" in the whole content
print("Searching for 'SIGNED by'...")
for match in re.finditer(r'SIGNED by', content):
    print(f"Found at {match.start()}: {content[match.start():match.start()+200]}")

# Search for the date 2026 near p15 area
print("Searching for '2026' near p15 area...")
p15_idx = content.find('id="pf15"')
if p15_idx != -1:
    idx_2026 = content.find('2026', p15_idx, p15_idx + 20000)
    if idx_2026 != -1:
        print(f"Found 2026 at {idx_2026}: {content[idx_2026-100:idx_2026+200]}")

