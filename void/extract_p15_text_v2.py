import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pff = content.find('id="pff"')
if start_pff != -1:
    # Find next page start to bound the search
    next_page = re.search(r'id="pf[0-9a-f]+"', content[start_pff+10:])
    if next_page:
        end_pff = start_pff + 10 + next_page.start()
    else:
        end_pff = len(content)
    
    segment = content[start_pff:end_pff]
    print(f"Segment length: {len(segment)}")
    # Remove large base64 data to find text
    text_only = re.sub(r'data:image/[^;]+;base64,[^"]+', '[IMAGE]', segment)
    print("Text version of Page 15 (pff):")
    # Also remove some clutter like SVG paths if any
    text_only = re.sub(r'<path[^>]*>', '', text_only)
    print(text_only[:3000])
else:
    print("pff not found")
