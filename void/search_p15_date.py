import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pff = content.find('id="pff"')
if start_pff != -1:
    next_page = re.search(r'id="pf[0-9a-f]+"', content[start_pff+10:])
    end_pff = start_pff + 10 + next_page.start() if next_page else len(content)
    segment = content[start_pff:end_pff]
    
    # Search for anything that looks like "2026 ... 12 ... 31" or similar
    # or just "31일"
    print("Searching in pff...")
    for m in re.finditer(r'[\d]{4}년\s*[\d]{1,2}월\s*[\d]{1,2}일', segment):
        print(f'Found date: {m.group()}')
    
    # Try searching without "년", "월", "일"
    for m in re.finditer(r'[\d]{4}\s*.\s*[\d]{1,2}\s*.\s*[\d]{1,2}', segment):
         print(f'Found numeric match: {m.group()} at {m.start()}')

else:
    print("pff not found")
