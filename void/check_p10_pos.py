file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('(2)')
if pos != -1:
    print(repr(content[pos-200:pos+500]))
else:
    print('"(2)" not found')
