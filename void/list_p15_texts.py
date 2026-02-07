import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pff = content.find('id="pff"')
if start_pff != -1:
    next_page = re.search(r'id="pf[0-9a-f]+"', content[start_pff+10:])
    end_pff = start_pff + 10 + next_page.start() if next_page else len(content)
    segment = content[start_pff:end_pff]
    
    # Extract all text inside div.t or spans
    texts = re.findall(r'>([^<>{}\n]+)<', segment)
    print("Found texts in Page 15:")
    for t in texts:
        if t.strip():
            print(f'"{t.strip()}"')
else:
    print("pff not found")
