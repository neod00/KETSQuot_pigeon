file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f'Total length: {len(content)}')
pos = content.find('id=\"pf11\"')
print(f'pf11 pos: {pos}')
if pos != -1:
    print(f'Content after pf11: {content[pos:pos+50]}...')
