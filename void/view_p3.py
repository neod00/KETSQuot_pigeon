file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('id="pf3"')
if pos != -1:
    chunk = content[pos:pos+10000]
    print(chunk.replace('><', '>\n<'))
else:
    print('pf3 not found')
