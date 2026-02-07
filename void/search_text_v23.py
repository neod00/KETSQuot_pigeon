import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16: total_days area
pos_16 = 4591563
print(f"P16 area: {content[pos_16-200:pos_16+1000]}")

# p15 variables - materiality_level at 4141677
pos_15 = 4141677
print(f"P15 area: {content[pos_15-1000:pos_15+1000]}")

# p17 Signature table - search for "SIGNED" again
for m in re.finditer("SIGNED", content[4600000:]):
    p = 4600000 + m.start()
    print(f"P17 Signature at {p}: {content[p-10:p+200]}")

# UI check
with open('web-app/src/app/page.tsx', 'r', encoding='utf-8') as f:
    page_content = f.read()
print(page_content[page_content.find('targetSites'):page_content.find('targetSites')+2000])

