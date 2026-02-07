import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Helper to find which page a position belongs to
def find_page_id(pos, content):
    # Search backwards for id="pf..."
    start = max(0, pos - 50000) # Look back a reasonable amount
    snippet = content[start:pos]
    matches = list(re.finditer(r'id="(pf[0-9a-f]+)"', snippet))
    if matches:
        return matches[-1].group(1)
    return "unknown"

print("=== FINDING '최종 제안금액' ===")
for m in re.finditer(r'최종 제안금액', content):
    page_id = find_page_id(m.start(), content)
    print(f"Found at {m.start()} in Page ID: {page_id}")
    # Show context
    print(content[m.start()-100:m.end()+100])
    
    # Check if bold
    # We look at the container div
    container_start = content.rfind('<div', 0, m.start())
    container_end = content.find('</div></div>', m.start()) + 12
    container = content[container_start:container_end]
    print(f"Container: {container}")
    if 'font-weight: 700' in container or 'bold' in container:
        print(">> IS BOLD")
    else:
        print(">> NOT BOLD")
    print("-" * 50)

print("\n=== FINDING '{{ hq_address }}' ===")
if '{{ hq_address }}' in content:
    pos = content.find('{{ hq_address }}')
    page_id = find_page_id(pos, content)
    print(f"Found at {pos} in Page ID: {page_id}")
    print(content[pos-200:pos+200])
else:
    print("{{ hq_address }} NOT FOUND")

print("\n=== FINDING '본사' in pfa (Page 10) ===")
# Find pfa start
pfa_match = re.search(r'id="pfa"', content)
if pfa_match:
    start = pfa_match.start()
    # Read next 5000 chars roughly to cover the page
    snippet = content[start:start+10000] # Page is usually large
    
    # Find "본사" in this snippet
    for m in re.finditer(r'본사', snippet):
        print(f"Found '본사' in pfa at relative {m.start()}")
        # context
        print(snippet[m.start()-100:m.end()+100])
else:
    print("Page pfa (10) not found")
