
from bs4 import BeautifulSoup
import sys

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf1 = soup.find('div', id='pf1')

for element in pf1.find_all(string=True):
    if '7527' in element:
        print(f"Found in element: {element.parent}")
        print(f"Parent Class: {element.parent.get('class')}")
        print(f"Parent Content: {element}")
