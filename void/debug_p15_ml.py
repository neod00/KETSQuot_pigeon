
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pff = soup.find('div', id='pff')
for div in pff.find_all('div', class_='t'):
    print(f"'{div.get_text()}'")
