
from bs4 import BeautifulSoup
import sys

file_path = 'LRQA_GHGP_contract.html'
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='cp949') as f:
        content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf1 = soup.find('div', id='pf1')

if not pf1:
    print("Could not find pf1")
    sys.exit(1)

# Mapping of exact text to replace
# We need to be careful as some text might be split across multiple elements
# but we can try to find the elements containing the specific strings.

replacements = {
    '회사명': '{{ company_name }}',
    'QR.001/DK/L1500176': '{{ proposal_no }}',
    'Dal Kim': '{{ lrqa_contact_name }}',
    'dal.kim@lrqa.com': '{{ lrqa_contact_email }}',
}

# Special handling for parts
parts_to_empty = ['[', ']', 'S', 'cope 1,2', ',3', '제', '3', '자', '검증', '01', '월', '12', '일', '7527']

for element in pf1.find_all(['div', 'span']):
    text = element.get_text().strip()
    
    if text in replacements:
        element.string = replacements[text]
    elif text in parts_to_empty:
        element.string = ''
    elif text == '온실가스 배출량':
         element.string = '{{ service_description }}'
    elif text == '+82-2-3703-':
         element.string = '{{ lrqa_contact_phone }}'
    elif ': 2026' in text:
         element.string = element.string.replace('2026', '{{ proposal_date }}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))
print("Finished replacements for Page 1 using BeautifulSoup")
