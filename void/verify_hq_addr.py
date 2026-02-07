file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('id="pf10"')
if pos != -1:
    chunk = content[pos:pos+10000]
    h_idx = chunk.find('{{ hq_address }}')
    if h_idx != -1:
        print(f'hq_address found in pf10 at rel offset {h_idx}')
        print(f'Context: {repr(chunk[h_idx-50:h_idx+150])}')
    else:
        print('hq_address NOT found in pf10')
        # Search everywhere
        all_idx = content.find('{{ hq_address }}')
        if all_idx != -1:
             print(f'hq_address found SOMEWHERE at absolute offset {all_idx}')
             # Find which page it belongs to
             page_start = content.rfind('id="pf', 0, all_idx)
             page_id = content[page_start:content.find('"', page_start+4)+1]
             print(f'Likely in page {page_id}')
else:
    print('pf10 not found')
