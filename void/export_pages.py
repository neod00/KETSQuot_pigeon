import re
with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

def get_page(no):
    id_str = f'id="pf{no}"'
    start = html.find(id_str)
    if start == -1: return None
    # Find next page or end
    end = html.find(f'id="pf{no+1}"', start)
    if end == -1: end = len(html)
    return html[start:end]

p2 = get_page(2)
if p2:
    with open('p2.html', 'w', encoding='utf-8') as f:
        f.write(p2)
    print("Exported P2")

p3 = get_page(3)
if p3:
    with open('p3.html', 'w', encoding='utf-8') as f:
        f.write(p3)
    print("Exported P3")

p15 = get_page(15)
if p15:
    with open('p15.html', 'w', encoding='utf-8') as f:
        f.write(p15)
    print("Exported P15")

p17 = get_page(17)
if p17:
    with open('p17.html', 'w', encoding='utf-8') as f:
        f.write(p17)
    print("Exported P17")
