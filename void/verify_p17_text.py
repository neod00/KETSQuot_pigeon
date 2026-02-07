import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
if start != -1:
    end = content.find('`;', start)
    segment = content[start:end]
    # Remove images
    segment = re.sub(r'data:image/[^;]+;base64,[^"]+', '[IMAGE]', segment)
    # Remove large SVG/Binary if any
    segment = re.sub(r'<path[^>]*>', '', segment)

    print("Page 17 (pf11) Text Segments:")
    texts = re.findall(r'>([^<>{}\n]+)<', segment)
    for t in texts:
        if t.strip():
            print(f'"{t.strip()}"')
    
    # Check for placeholders
    ph = re.findall(r'\{\{\s*\w+\s*\}\}', segment)
    print("Found placeholders:", ph)
else:
    print("pf11 not found")
