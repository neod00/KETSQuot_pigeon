import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Signature table labels search
print("P17 Signature labels search:")
for l in ["서명", "직책", "성명", "일자"]:
    for m in re.finditer(l, content[4660000:4680000]):
         print(f"Found {l} at {4660000+m.start()}: {content[4660000+m.start()-10:4660000+m.start()+150]}")

# p16 Spacing
print("P16 sentence again:")
idx_16 = content.find("해당 프로젝트는")
if idx_16 != -1:
    print(f"Content: {content[idx_16-20:idx_16+400]}")

# p15 variables
p15_start = content.find('id="pf15"')
if p15_start != -1:
    print("P15 segment scan for {{...")
    for m in re.finditer(r'{{ (.*?) }}', content[p15_start:p15_start+20000]):
        print(f"Found {m.group(0)} at {p15_start+m.start()}")

