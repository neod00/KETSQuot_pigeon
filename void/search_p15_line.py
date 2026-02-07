import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043] # Page 15
print(f'Line 3044 length: {len(line_3044)}')

# Search for any date-like patterns
for m in re.finditer(r'202[0-9]', line_3044):
    print(f'Found {m.group()} at rel offset {m.start()}')
    print(f'Context: {repr(line_3044[m.start()-20:m.start()+100])}')

# Search for reporting_deadline placeholder
if '{{ reporting_deadline }}' in line_3044:
    print('{{ reporting_deadline }} FOUND in line 3044')
else:
    print('{{ reporting_deadline }} NOT found in line 3044')
