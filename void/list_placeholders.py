import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

placeholders = re.findall(r'\{\{.*?\}\}', content)
for p in set(placeholders):
    print(p)
