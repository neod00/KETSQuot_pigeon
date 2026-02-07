import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 variables inspection
pos = 4671619
print(f"Content at 4671619: {content[pos-500:pos+1000]}")

# p10 hq address
p10_id = content.find('id="pf10"')
if p10_id != -1:
    print(f"Content after pf10 (3000 chars): {content[p10_id:p10_id+3000]}")

