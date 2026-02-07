import os

file_path = 'web-app/src/constants/template.ts'
if not os.path.exists(file_path):
    print('File not found')
else:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f'Total length: {len(content)}')
    pos = content.find('id="pf11"')
    print(f'pf11 pos: {pos}')
    if pos != -1:
        chunk = content[pos:pos+1000]
        # Replace non-printable characters or weird stuff
        print(f'Content starts: {repr(chunk[:200])}')
