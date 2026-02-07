file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

placeholders = ['client_representative_name', 'client_representative_title', 'client_representative_date']
pf11_pos = content.find('id="pf11"')
if pf11_pos != -1:
    chunk = content[pf11_pos:]
    for p in placeholders:
        idx = chunk.find(p)
        if idx != -1:
            print(f'Placeholder "{p}" found in pf11 at relative offset {idx}')
            print(f'Context: {repr(chunk[idx-100:idx+200])}')
        else:
            print(f'Placeholder "{p}" NOT found in pf11')
else:
    print('pf11 not found')
