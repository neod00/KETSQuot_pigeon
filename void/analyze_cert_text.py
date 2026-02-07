import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all occurrences of "검증의견서"
for m in re.finditer('검증의견서', content):
    print(f'Found "검증의견서" at offset {m.start()}')
    # Find which page
    page_start = content.rfind('id="pf', 0, m.start())
    page_id = "unknown"
    if page_start != -1:
        page_id = content[page_start:content.find('"', page_start+4)+1]
    
    print(f'In page {page_id}')
    print(f'Context: {repr(content[m.start()-100:m.start()+200])}')
    print('-' * 40)
