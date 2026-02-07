import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Search for representative
print("P17 variables search:")
for v in ["client_representative_title", "client_representative_name", "company_name"]:
    pos = content.find(v)
    if pos != -1:
        print(f"Variable {v} found at {pos}: {content[pos-100:pos+200]}")

# p15 Search for "마감일" (Deadline) or "2026"
print("P15 Deadline search:")
p15_start = content.find('id="pf15"')
if p15_start != -1:
    idx_2026 = content.find("2026", p15_start, p15_start + 20000)
    if idx_2026 != -1:
        print(f"2026 found at {idx_2026}: {content[idx_2026-100:idx_2026+500]}")

# p16 Spacing
print("P16 sentence search again:")
idx_16 = content.find("해당 프로젝트는")
if idx_16 != -1:
    print(f"Found it at {idx_16}")
    print(content[idx_16:idx_16+300])

