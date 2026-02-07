
from bs4 import BeautifulSoup, NavigableString
import sys

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf1 = soup.find('div', id='pf1')

replacements = {
    '회사명': '{{ company_name }}',
    'QR.001/DK/L1500176': '{{ proposal_no }}',
    'Dal Kim': '{{ lrqa_contact_name }}',
    'dal.kim@lrqa.com': '{{ lrqa_contact_email }}',
    '온실가스 배출량': '{{ service_description }}',
    '+82-2-3703-': '{{ lrqa_contact_phone }}'
}

parts_to_empty = ['[', ']', 'S', 'cope 1,2', ',3', '제', '3', '자', '검증', '01', '월', '12', '일', '7527']

# We collect nodes to update to avoid issues during iteration
updates = []

for element in pf1.find_all(['div', 'span']):
    # Check if it has any elements as children. If so, it might be a container.
    has_element_child = any(not isinstance(c, NavigableString) for c in element.children)
    if has_element_child:
        continue
        
    text = element.get_text().strip()
    
    if text in replacements:
        updates.append((element, replacements[text]))
    elif text in parts_to_empty:
        updates.append((element, ''))
    elif ': 2026' in text:
        updates.append((element, element.string.replace('2026', '{{ proposal_date }}')))

for el, new_str in updates:
    el.string = new_str

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))
print(f"Finished replacements for Page 1. Replaced {len(updates)} elements.")
