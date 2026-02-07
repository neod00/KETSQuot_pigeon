import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        matches = re.findall(r'id="(pf[0-9a-f]+)"', line)
        if matches:
            print(f'Line {i+1} mentions pages: {", ".join(matches)}')
