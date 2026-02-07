
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf11 = soup.find('div', id='pf11')

# Target divs for Title and Name
title_container = pf11.find('div', class_='y268')
if title_container:
    text_div = title_container.find('div', class_='t')
    if text_div:
        text_div.string = '{{ client_representative_title }}'

name_container = pf11.find('div', class_='y269')
if name_container:
    text_div = name_container.find('div', class_='t')
    if text_div:
        text_div.string = '{{ client_representative_name }}'

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Successfully applied signature variables using BeautifulSoup.")
