import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pfa = content.find('id="pfa"')
end_pfa = content.find('id="pfb"', start_pfa)
segment = content[start_pfa:end_pfa]

match = re.search(r'\(2\)', segment)
if match:
    # Get 2000 chars after (2)
    chunk = segment[match.start():match.start()+2000]
    with open('p10_chunk.html', 'w', encoding='utf-8') as f:
        f.write(chunk)
    print("Chunk written to p10_chunk.html")
else:
    print("(2) not found")
