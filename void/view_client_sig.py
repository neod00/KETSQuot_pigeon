file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('client_representative_name')
if pos != -1:
    chunk = content[pos-500:pos+1500]
    # Clean the chunk for printing
    print(chunk.replace('><', '>\n<'))
else:
    print('Not found')
