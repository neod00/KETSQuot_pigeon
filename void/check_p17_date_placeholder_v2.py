import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
end = content.find('`;', start)
segment = content[start:end]

for m in re.finditer(r'\{\{\s*proposal_date_korean_long\s*\}\}', segment):
    print(f'Placeholder at rel offset {m.start()}')
    print(f'Context: {repr(segment[m.start()-300:m.start()+100])}')
    print("-" * 50)
