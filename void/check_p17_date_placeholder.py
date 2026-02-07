import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
end = content.find('`;', start)
segment = content[start:end]

# Find placeholders and their context
for m in re.finditer(r'\{\{\s*proposal_date_korean_long\s*\}\}', segment):
    print(f'Placeholder at offset {m.start()}')
    print(f'Context before: {repr(segment[m.start()-200:m.start()])}')
