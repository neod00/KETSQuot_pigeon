file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3039 = lines[3038] # Page 10 (pfa)
import re
for m in re.finditer('hq_address', line_3039):
    print(f'Found at {m.start()}')
    print(f'Context: {repr(line_3039[m.start()-100:m.start()+200])}')
