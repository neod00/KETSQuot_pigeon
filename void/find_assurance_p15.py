import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043]
for m in re.finditer('assurance_level', line_3044):
    print(f'Found at offset {m.start()}')
    print(f'Context: {repr(line_3044[m.start()-100:m.start()+200])}')
