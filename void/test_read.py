file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('id=\"pf11\"')
if pos != -1:
    # Print 5000 characters from pf11
    print(content[pos:pos+5000])
else:
    print('Not found')
