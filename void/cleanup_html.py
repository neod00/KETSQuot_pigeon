
from bs4 import BeautifulSoup
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')

# 1. Fix Page 1 (pf1)
pf1 = soup.find('div', id='pf1')
if pf1:
    for div in pf1.find_all('div', class_='t'):
        text = div.get_text().strip()
        # Remove "Scope 1,2" and "제"
        if text == 'Scope 1,2' or text == '제':
            div.decompose()
        # Remove "01" and "12" if they are part of the residue
        # The date is usually 2026-01-12 01 월 12
        elif text == '01' or text == '12' or text == '월':
             # Only delete if it's near the proposal_date
             # But it's safer to just look for the specific residue
             # In extract_p1 it showed:
             # 일자 : {{ proposal_date }}
             # 01
             # 월
             # 12
             div.decompose()

# 2. Fix potential date residues in other pages if any
# (Page 10, Page 17)
for page_id in ['pfa', 'pf11']:
    pf = soup.find('div', id=page_id)
    if pf:
        for div in pf.find_all('div', class_='t'):
            text = div.get_text().strip()
            if text in ['01', '12', '월']:
                div.decompose()

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Cleaned up residue text from HTML template.")
