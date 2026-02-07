import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16 Spacing
print("P16 segment check:")
p16_id = content.find('id="pf16"')
if p16_id != -1:
    idx_haedang = content.find("해당", p16_id, p16_id + 10000)
    if idx_haedang != -1:
        print(f"Haedang at {idx_haedang}: {content[idx_haedang:idx_haedang+1000]}")

# p17 Table Analysis - let's search for "성명" near the end
print("P17 signature search:")
for m in re.finditer("성명", content[4660000:]):
    pos = 4660000 + m.start()
    print(f"Found 성명 at {pos}: {content[pos-50:pos+300]}")

