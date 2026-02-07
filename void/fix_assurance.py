
from bs4 import BeautifulSoup
import sys

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf3 = soup.find('div', id='pf3')

if pf3:
    for element in pf3.find_all(string=True):
        if '제한적' in element:
            print(f"Replacing '제한적' in: {element}")
            element.replace_with('{{ assurance_level }}')
        if '보증수준' in element:
            element.replace_with('')
        if '(Limited level of assurance)' in element:
            element.replace_with('')
        if '(Lim' in element:
            element.replace_with('')
        if 'ited level of assurance)' in element:
            element.replace_with('')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))
print("Fixed assurance_level replacement.")
