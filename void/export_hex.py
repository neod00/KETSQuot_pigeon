import re
with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

# HEX IDs: 10 = 16, 11 = 17
def get_page_hex(hex_id):
    id_str = f'id="pf{hex_id}"'
    start = html.find(id_str)
    if start == -1: return None
    # Find next page (could be hex)
    # This is a bit tricky, let's just find the next <div class="pf"
    next_start = html.find('<div class="pf"', start + 1)
    if next_start == -1: next_start = len(html)
    return html[start:next_start]

# Page 15 is 'f'
# Page 17 is '11'
p15 = get_page_hex('f')
if p15:
    with open('p15.html', 'w', encoding='utf-8') as f: f.write(p15)
    print("Exported P15 (hex f)")

p17 = get_page_hex('11')
if p17:
    with open('p17.html', 'w', encoding='utf-8') as f: f.write(p17)
    print("Exported P17 (hex 11)")
