import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def find_page_id(pos, content):
    start = max(0, pos - 50000)
    snippet = content[start:pos]
    matches = list(re.finditer(r'id="(pf[0-9a-f]+)"', snippet))
    if matches:
        return matches[-1].group(1)
    return "unknown"

# Check "본사" at 1772189 (approx from previous run)
matches = list(re.finditer(r'본사', content))
target_match = None
for m in matches:
    # We look for the one in typical PDF structure ( Page 10 )
    pid = find_page_id(m.start(), content)
    print(f"'본사' found at {m.start()} in {pid}")
    if pid == 'pfa' or pid == 'pf10': # pfa is 10
        target_match = m

if target_match:
    print("Masking Page 10 'HQ Address' location...")
    # Check if placeholder is near
    context = content[target_match.start():target_match.start()+500]
    print(f"Context: {context}")
    if '{{ hq_address }}' not in context:
        print("Missing placeholder in Page 10!")
    else:
        print("Placeholder seems present in Page 10.")

# Search for "제안금액" or "특별할인"
print("\n=== Searching for Proposal Amount Parts ===")
for word in ['제안금액', '특별할인', 'VAT', 'final_cost']:
    for m in re.finditer(word, content):
        pid = find_page_id(m.start(), content)
        print(f"'{word}' found at {m.start()} in {pid}")
        # Print context
        print(content[m.start()-100:m.end()+100])
        print("-" * 30)
