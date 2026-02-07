import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3045 = lines[3044] # 0-indexed
print(f'Line 3045 length: {len(line_3045)}')

# Search for any date-like patterns
for m in re.finditer(r'202[0-9]', line_3045):
    print(f'Found {m.group()} at rel offset {m.start()}')
    print(f'Context: {repr(line_3045[m.start()-20:m.start()+100])}')

if '{{ reporting_deadline }}' in line_3045:
    print('{{ reporting_deadline }} FOUND in line 3045')
else:
    print('{{ reporting_deadline }} NOT found in line 3045')
