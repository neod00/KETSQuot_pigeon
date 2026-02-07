import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for assurance_level
for m in re.finditer('assurance_level', content):
    context = content[max(0, m.start()-100):min(len(content), m.start()+200)]
    print(f'Found at {m.start()}')
    print(f'Context: {repr(context)}')
    if 'font-weight: 700' in context:
        print('VALUE IS BOLD')
    else:
        print('VALUE NOT BOLD')
    print("-" * 50)
