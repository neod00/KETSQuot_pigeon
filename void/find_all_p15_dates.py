import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043]
# Find anything like XXXX년 XX월 XX일 or just the numbers
for m in re.finditer(r'202[\d].*?일', line_3044):
    print(f'Candidate: {repr(m.group())}')
