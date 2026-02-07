import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16: total_days search
print("P16 total_days lookup:")
for m in re.finditer("total_days", content):
    p = m.start()
    print(f"Found it at {p}: {content[p-200:p+500]}")

# p15 variables
print("P15 segment variables:")
idx_p15 = content.find('id="pf15"')
if idx_p15 != -1:
    idx_p16 = content.find('id="pf16"', idx_p15)
    print(f"P15 content segment ({idx_p15} to {idx_p16}):")
    print(content[idx_p15:idx_p15+10000])

# p17 Table Analysis
idx_p17 = content.find('id="pf17"')
if idx_p17 != -1:
    print(f"P17 table segment ({idx_p17} onwards):")
    print(content[idx_p17:idx_p17+10000])

