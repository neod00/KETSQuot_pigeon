import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all occurrences of assurance_level
for m in re.finditer('assurance_level', content):
    print(f'Found at {m.start()}')
    # Check if inside span with bold
    context = content[max(0, m.start()-100):min(len(content), m.start()+100)]
    if 'font-weight: 700 !important;' in context:
        print('BOLDED')
    else:
        print('NOT BOLDED')
    # Find page
    page_start = content.rfind('id="pf', 0, m.start())
    page_id = content[page_start:content.find('"', page_start+4)+1]
    print(f'In page {page_id}')
