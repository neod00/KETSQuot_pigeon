import re
with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

pages = re.findall(r'<div[^>]*id="pf([0-9a-f]+)"', html)
print(f"Total pages found: {len(pages)}")
print(f"Page IDs: {pages}")
