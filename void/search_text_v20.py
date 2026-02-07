import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Signature table labels search
print("P17 Signature labels search:")
# Let's search for "서명", "직책", "성명", "일자" near 4672448
base = 4672448
print(content[base-2000:base+1000])

# p16 Spacing - find "소요될 것이다"
print("P16 spacing check:")
idx_soyo = content.find("소요될")
if idx_soyo != -1:
    print(f"Found 소요될 at {idx_soyo}: {content[idx_soyo-100:idx_soyo+500]}")

