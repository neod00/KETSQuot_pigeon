
from bs4 import BeautifulSoup

with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

pf1 = soup.find('div', id='pf1')
if pf1:
    for div in pf1.find_all('div', class_='t'):
        print(f"[{div.get_text()}]")
