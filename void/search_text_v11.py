import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Table Analysis - search for "SIGNED by LRQA"
idx_signed = content.find("SIGNED by LRQA")
if idx_signed != -1:
    print(f"SIGNED by LRQA found at {idx_signed}: {content[idx_signed:idx_signed+2000]}")

# p17 Search for "대표이사" (Representative Director)
idx_rep = content.find("대표이사")
if idx_rep != -1:
    print(f"Found 대표이사 at {idx_rep}: {content[idx_rep-100:idx_rep+1000]}")

# UI modification in page.tsx
with open('web-app/src/app/page.tsx', 'r', encoding='utf-8') as f:
    page_content = f.read()
print("page.tsx snippet around targetSites:")
idx_ts = page_content.find('targetSites')
if idx_ts != -1:
    print(page_content[idx_ts-500:idx_ts+500])

