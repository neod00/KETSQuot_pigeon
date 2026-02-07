file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('id="pfa"')
if pos != -1:
    chunk = content[pos:pos+10000]
    # Look for hq_address
    h_idx = chunk.find('{{ hq_address }}')
    if h_idx != -1:
        print(f'hq_address found at rel offset {h_idx}')
        print(f'Context: {repr(chunk[h_idx-50:h_idx+150])}')
    else:
        print('hq_address NOT found in pfa')
else:
    print('pfa not found')
