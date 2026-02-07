import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

for m in re.finditer('보증수준', content):
    context = content[m.start()-100:m.start()+200]
    print(f'Found at {m.start()}')
    print(f'Context: {repr(context)}')
    if 'font-weight: 700' in context:
        print('IS BOLD')
    else:
        print('NOT BOLD')
    print("-" * 50)
