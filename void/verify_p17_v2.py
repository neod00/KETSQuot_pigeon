import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3046 = lines[3045] # Page 17

labels = ['서명', '직책:', '성명:', '일자:']
for label in labels:
    if label in line_3046:
        print(f'Found label "{label}" on Page 17')
        idx = line_3046.find(label)
        print(f'Context: {repr(line_3046[idx-50:idx+150])}')
    else:
        print(f'Label "{label}" NOT found on Page 17')

# Check for placeholders nearby
placeholders = ['{{ client_representative_name }}', '{{ client_representative_title }}', '{{ proposal_date_korean_long }}']
for p in placeholders:
    if p in line_3046:
        print(f'Found placeholder "{p}" on Page 17')
    else:
        print(f'Placeholder "{p}" NOT found on Page 17')
