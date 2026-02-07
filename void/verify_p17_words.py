import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
end = content.find('`;', start)
segment = content[start:end]

for word in ['직책', '성명', '일자']:
    if word in segment:
        print(f'Found "{word}"')
        pos = segment.find(word)
        print(f'Context: {repr(segment[pos:pos+50])}')
    else:
        print(f'"{word}" NOT found')
