import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find "2026년 12월 31일" potentially split by tags
# We search for the digits and month names
pattern = r'202[0-9].*12.*31'
for m in re.finditer(pattern, content):
    print(f'Found match at {m.start()}: {repr(content[m.start():m.start()+100])}')
