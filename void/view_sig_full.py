import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('SIGNED by')
if pos != -1:
    chunk = content[pos:pos+15000]
    # Remove large data uris to keep it readable
    chunk = re.sub(r'src="data:image/[^"]+"', 'src="DATA_URI"', chunk)
    print(chunk.replace('><', '>\n<'))
else:
    print('SIGNED by not found')
