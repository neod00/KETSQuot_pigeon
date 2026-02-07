import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for "본사 주소"
for m in re.finditer('본사 주소', content):
    print(f'Found "본사 주소" at offset {m.start()}')
    # Find which page
    page_start = content.rfind('id="pf', 0, m.start())
    page_id = content[page_start:content.find('"', page_start+4)+1]
    print(f'In page {page_id}')
    print(f'Context: {repr(content[m.start()-50:m.start()+200])}')
