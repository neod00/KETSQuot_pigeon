import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Signature table
# Search for labels "서명:", "직책:", "성명:", "일자:"
print("P17 Signature labels search (with colon):")
for l in ["서명:", "직책:", "성명:", "일자:"]:
    for m in re.finditer(l, content[4660000:]):
         print(f"Found {l} at {4660000+m.start()}")

# p15 variables
print("P15 segment scan for vars on p15:")
p15_start = content.find('id="pf15"')
if p15_start != -1:
    p16_start = content.find('id="pf16"', p15_start)
    segment = content[p15_start:p16_start] if p16_start != -1 else content[p15_start:]
    for m in re.finditer(r'{{ (.*?) }}', segment):
        print(f"Found {m.group(0)} at {p15_start+m.start()}")

# p16 Spacing
print("P16 sentence check (id=pf16):")
p16_id = content.find('id="pf16"')
if p16_id != -1:
    idx_haedang = content.find("해당", p16_id)
    if idx_haedang != -1:
        print(f"Found at {idx_haedang}: {content[idx_haedang:idx_haedang+400]}")

