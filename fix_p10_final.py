import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Clean up previous attempts (crucial to avoid duplicates)
# Remove any div with the specific style we added
content = re.sub(r'<div[^>]*style="[^"]*bottom: 688\.5px[^"]*".*?</div>', '', content, flags=re.DOTALL)

# Find "본사" in "pfa" (Page 10)
# We search for the specific text because PDF2HTMLex structure is consistent locally
match = re.search(r'(id="pfa".*?)(본사.*?주소.*?</div></div>)', content, re.DOTALL)
if match:
    # "match" captures from "id=pfa" up to the end of "본사...주소...</div></div>"
    # We want to insert RIGHT AFTER the match.group(2) part? No.
    # match.group() is the whole thing.
    
    # Let's just find the "본사 주소" occurrence after "pfa"
    pfa_idx = content.find('id="pfa"')
    if pfa_idx != -1:
        # Search for "본사" after pfa
        bonsa_idx = content.find('본사', pfa_idx)
        if bonsa_idx != -1:
            # Find the closing of the container div.
            # Usually: <div ...><span ...>본사 주소:</span></div></div>
            # Start from bonsa_idx, look for "</div></div>"
            close_idx = content.find('</div></div>', bonsa_idx)
            if close_idx != -1:
                insert_pos = close_idx + 12 # len('</div></div>')
                print(f"Found insertion point at {insert_pos}")
                
                # New element
                new_hq_element = '<div class="t m0 x1 h10" style="bottom: 688.5px; left: 110px; width: 450px; white-space: pre-wrap; font-family: sans-serif; font-size: 14px; font-weight: normal; color: #000; line-height: 1.2; position: absolute; z-index: 100;">{{ hq_address }}</div>'
                
                content = content[:insert_pos] + new_hq_element + content[insert_pos:]
                print("Successfully injected '{{ hq_address }}' placeholder.")
            else:
                print("Could not find closing div for 본사.")
        else:
            print("Could not find '본사' in Page 10.")
    else:
        print("Page 10 (pfa) not found.")
else:
    # Fallback: simple search for "본사 주소" in the whole file
    print("Complex regex failed, trying simple search...")
    m = re.search(r'본사\s*주소.*?:', content)
    if m:
        close_idx = content.find('</div></div>', m.start())
        if close_idx != -1:
             insert_pos = close_idx + 12
             new_hq_element = '<div class="t m0 x1 h10" style="bottom: 688.5px; left: 110px; width: 450px; white-space: pre-wrap; font-family: sans-serif; font-size: 14px; color: #000; line-height: 1.2; position: absolute; z-index: 100;">{{ hq_address }}</div>'
             content = content[:insert_pos] + new_hq_element + content[insert_pos:]
             print("Successfully injected '{{ hq_address }}' via fallback.")
    else:
        print("Fatal: '본사 주소' string completely missing.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
