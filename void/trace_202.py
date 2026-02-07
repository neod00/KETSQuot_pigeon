file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043]
import re
for m in re.finditer('202', line_3044):
    print(f'Found 202 at {m.start()}')
    print(f'Context: {repr(line_3044[m.start():m.start()+200])}')
