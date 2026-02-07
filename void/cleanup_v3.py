
from bs4 import BeautifulSoup

path = 'LRQA_GHGP_contract.html'
with open(path, 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

# Fix Page 1
for div in soup.find_all('div', class_='t'):
    text = div.get_text()
    if '{{ service_description }}' in text and 'Scope' in text:
        new_text = text.replace('Scope 1,2', '').replace('제', '').strip()
        div.string = new_text
    
    if '{{ proposal_date }}' in text and '01' in text and '12' in text:
        new_text = text.replace('01', '').replace('월', '').replace('12', '').strip()
        div.string = new_text

# Check other pages for similar date residue
for page_id in ['pfa', 'pf11']:
    p = soup.find('div', id=page_id)
    if p:
        for div in p.find_all('div', class_='t'):
            text = div.get_text()
            if '{{ proposal_date }}' in text and ('01' in text or '월' in text or '12' in text):
                new_text = text.replace('01', '').replace('월', '').replace('12', '').strip()
                div.string = new_text

with open(path, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Cleaned combined text nodes.")
