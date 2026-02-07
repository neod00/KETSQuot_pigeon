file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('id="pf3"')
if pos != -1:
    chunk = content[pos:pos+15000]
    if '{{ hq_address }}' in chunk:
        print('hq_address found in Page 3 redesign')
        # Find where it is
        start = chunk.find('{{ hq_address }}')
        print(f'Context: {repr(chunk[start-100:start+200])}')
    else:
        print('hq_address NOT in Page 3')
else:
    print('pf3 not found')
