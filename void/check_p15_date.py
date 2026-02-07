file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('id="pff"')
if pos != -1:
    chunk = content[pos:pos+10000]
    print(f'Page 15 content part: {repr(chunk[:500])}')
    # Search for anything looking like a date
    if '2026' in chunk:
        print('Found 2026 in Page 15')
        idx = chunk.find('2026')
        print(f'Context: {repr(chunk[idx-20:idx+100])}')
else:
    print('pff NOT found')
