import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Signature table
# Search for labels "서명", "직책", "성명", "일자"
labels = ["직책", "성명", "일자"]
for l in labels:
    for m in re.finditer(l, content[4660000:4680000]):
         print(f"Found {l} at {4660000+m.start()}: {content[4660000+m.start()-10:4660000+m.start()+200]}")

# p15 variables
p15_id = content.find('id="pf15"')
if p15_id != -1:
    print(f"P15 area found at {p15_id}")
    # Search for anything that looks like a variable
    for m in re.finditer(r'{{ (.*?) }}', content[p15_id:p15_id+15000]):
        print(f"Found variable {m.group(0)} at {p15_id+m.start()}: {content[p15_id+m.start()-50:p15_id+m.start()+50]}")

