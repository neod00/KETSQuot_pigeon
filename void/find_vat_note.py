
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = re.finditer(r'부.{0,50}가세.{0,50}VAT.{0,50}가', content)
for m in matches:
    print(f"Match found: {content[m.start():m.end()+100]}")
