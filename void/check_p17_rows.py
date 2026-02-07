import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
end = content.find('`;', start)
segment = content[start:end]

# Search for the rows
# SIGNED by row
# Signature row
# Title row
# Name row
# Date row

for m in re.finditer(r'SIGNED by', segment):
    print(f'SIGNED by at {m.start()}')
    print(f'Context: {repr(segment[m.start():m.start()+500])}')

for m in re.finditer(r'y267', segment): # y267 is usually the signature row
    print(f'Row y267 at {m.start()}')
    print(f'Context: {repr(segment[m.start():m.start()+300])}')
