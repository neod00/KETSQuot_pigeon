
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pff = soup.find('div', id='pff')

# 1. Reporting Period
found_rp = False
for div in pff.find_all('div', class_='t'):
    if '보고기간' in div.get_text():
        div.string = '보고기간 : {{ reporting_period_full }}'
        found_rp = True
        break
print(f"Reporting Period replaced: {found_rp}")

# 2. Assurance Level
found_al = False
for div in pff.find_all('div', class_='t'):
    text = div.get_text()
    if '제한적' in text and '보증수준' in text:
        div.string = '{{ assurance_level }}'
        found_al = True
        break
print(f"Assurance Level replaced: {found_al}")

# 3. Materiality
found_ml = False
for div in pff.find_all('div', class_='t'):
    if div.get_text().strip() == '5%':
        div.string = '{{ materiality_level }}'
        found_ml = True
        break
print(f"Materiality replaced: {found_ml}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))
