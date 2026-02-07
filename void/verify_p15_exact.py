import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pff = content.find('id="pff"')
segment = content[start_pff:start_pff+10000]

for m in re.finditer('보증수준', segment):
    print(f'Found at {m.start()}')
    print(repr(segment[m.start()-100:m.start()+200]))
