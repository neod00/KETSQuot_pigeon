import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for patterns like 2026...12...31
matches = re.findall(r'2026.*12.*31', content)
for m in matches:
    print(f'Found match: {repr(m)}')
