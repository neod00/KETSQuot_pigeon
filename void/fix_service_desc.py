
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

for element in pf1.find_all(['div', 'span']):
    text = element.get_text().strip()
    if '온실가스' in text:
         element.string = '{{ service_description }}'
         print(f"Found and replaced: {text}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))
