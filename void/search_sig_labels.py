import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

labels = ['서명', '직책', '성명', '일자']
pf11_pos = content.find('id="pf11"')
if pf11_pos != -1:
    chunk = content[pf11_pos:pf11_pos+20000]
    for label in labels:
        found = [m.start() for m in re.finditer(label, chunk)]
        print(f'Label "{label}" found at offsets in chunk: {found}')
        for pos in found:
            print(f'Context: {repr(chunk[pos-50:pos+150])}')
else:
    print('pf11 not found')
