import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pff = content.find('id="pff"')
next_page = re.search(r'id="pf[0-9a-f]+"', content[start_pff+10:])
end_pff = start_pff + 10 + next_page.start() if next_page else len(content)
segment = content[start_pff:end_pff]

# Search for labels and values
search_terms = ['보증수준', '중요성', 'assurance_level', 'materiality_level']
for word in search_terms:
    for m in re.finditer(word, segment):
        print(f'Found "{word}" at rel offset {m.start()}')
        # Find the containing div or span
        context = segment[max(0, m.start()-150):min(len(segment), m.start()+300)]
        print(f'Context: {repr(context)}')
        print("-" * 100)
