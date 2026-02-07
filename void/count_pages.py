
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
pages = re.findall(r'id="pf([0-9a-f]+)"', content)
print(f"Pages found: {len(pages)}")
print(f"Last page IDs: {pages[-5:]}")
