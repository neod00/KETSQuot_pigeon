import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pff = content.find('id="pff"')
next_page = re.search(r'id="pf[0-9a-f]+"', content[start_pff+10:])
end_pff = start_pff + 10 + next_page.start() if next_page else len(content)
segment = content[start_pff:end_pff]

# Clean segment from images/binary for easier reading
segment_clean = re.sub(r'data:image/[^;]+;base64,[^"]+', '[IMAGE]', segment)

# Save to a file to inspect
with open('p15_debug.html', 'w', encoding='utf-8') as f:
    f.write(segment_clean)

print("Segment saved to p15_debug.html")

# Search for the terms in the clean segment
for word in ['보증수준', '중요성', 'assurance_level', 'materiality_level']:
    indices = [m.start() for m in re.finditer(word, segment_clean)]
    print(f'"{word}" found at: {indices}')
    for idx in indices:
        print(f'Context: {repr(segment_clean[max(0, idx-100):idx+300])}')
        print("-" * 50)
