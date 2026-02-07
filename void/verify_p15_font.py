file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('보증수준')
if pos != -1:
    print(repr(content[pos-50:pos+150]))
else:
    print('"보증수준" not found')
