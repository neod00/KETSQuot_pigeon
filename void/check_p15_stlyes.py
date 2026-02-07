import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pff = content.find('id="pff"')
next_page = re.search(r'id="pf[0-9a-f]+"', content[start_pff+10:])
end_pff = start_pff + 10 + next_page.start() if next_page else len(content)
segment = content[start_pff:end_pff]

# Search for "보증수준" and "중요성 기준"
for word in ['보증수준', '중요성 기준']:
    for m in re.finditer(word, segment):
        print(f'Found "{word}" at rel offset {m.start()}')
        # Find the containing div or span
        context = segment[max(0, m.start()-200):min(len(segment), m.start()+200)]
        print(f'Context: {repr(context)}')
        print("-" * 50)
