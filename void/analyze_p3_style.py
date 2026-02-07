import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 'target_sites' is near '본사:' context (Page 3)
idx = content.find('{{ target_sites }}')
if idx != -1:
    print("--- P3 Target Sites Container Analysis ---")
    # Look for the surrounding structure of target_sites
    # pdf2htmlEX usually uses absolute positioning for divs (hX class defines height)
    snippet = content[idx-500:idx+500]
    print(snippet)
