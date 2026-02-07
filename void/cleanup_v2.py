
from bs4 import BeautifulSoup

path = 'LRQA_GHGP_contract.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
pf1 = soup.find('div', id='pf1')

if pf1:
    # Find all text nodes and replace or remove
    # Looking for 'Scope 1,2', '제', '01', '월', '12'
    for div in pf1.find_all('div', class_='t'):
        txt = div.get_text().strip()
        if txt in ['S', 'cope 1,2', '제', '01', '월', '12']:
            div.decompose()

# Also check Page 10 (pfa) and Page 17 (pf11) for date residue
for pid in ['pfa', 'pf11']:
    p = soup.find('div', id=pid)
    if p:
        for div in p.find_all('div', class_='t'):
            txt = div.get_text().strip()
            if txt in ['01', '월', '12']:
                div.decompose()

with open(path, 'w', encoding='utf-8') as f:
    f.write(str(soup))
print("Manual cleanup of residues finished.")
