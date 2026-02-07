import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043] # Page 15
# Search for numeric parts of the date
for m in re.finditer(r'[\d]{4}|12|31', line_3044):
    print(f'Found "{m.group()}" at offset {m.start()}: context {repr(line_3044[m.start()-10:m.start()+20])}')
