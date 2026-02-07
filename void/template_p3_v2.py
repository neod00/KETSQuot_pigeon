
from bs4 import BeautifulSoup, NavigableString
import sys

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf3 = soup.find('div', id='pf3')

# 1. Company Name [회사명]
# 2. HQ Address [본사 주소]
# 3. Target Sites [대상 사업장]
# 4. Verification Year (2025)
# 5. Assurance Level
# 6. Materiality Level (5%)

replacements = {
    '회사명': '{{ company_name }}',
    '본사': '', # We handle address replacement carefully
    '주소': '',
    '대상': '', # We handle target sites carefully
    '사업장': '',
    '제한적': '{{ assurance_level }}',
    '보증수준': '',
    '5%': '{{ materiality_level }}'
}

year_to_replace = '2025'

found_names = False
found_address_count = 0
found_targets = False
found_assurance = False

for element in pf3.find_all(['div', 'span']):
    # Leaf nodes only
    if any(not isinstance(c, NavigableString) for c in element.children):
        continue
    
    text = element.get_text().strip()
    
    if text == '회사명':
        element.string = '{{ company_name }}'
        found_names = True
    elif text == '본사':
        # We find '본사' and the following '주소' to place the variable
        # But for simplicity, if we find '본사' we can check if it's part of the address block
        element.string = '{{ hq_address }}' if found_address_count < 2 else ''
        found_address_count += 1
    elif text == '주소':
        element.string = ''
    elif text == '대상':
        element.string = '{{ target_sites }}'
        found_targets = True
    elif text == '사업장':
        element.string = ''
    elif '2025' in text:
        element.string = '{{ verification_year }}'
    elif text == '제한적':
        element.string = '{{ assurance_level }}'
        found_assurance = True
    elif text == '보증수준':
        element.string = ''
    elif '(Limited level of assurance)' in text:
        element.string = ''
    elif '(Lim' in text:
        element.string = ''
    elif 'ited level of assurance)' in text:
        element.string = ''
    elif text == '5%':
        element.string = '{{ materiality_level }}'

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Applied replacements for Page 3 using leaf-node matching.")
