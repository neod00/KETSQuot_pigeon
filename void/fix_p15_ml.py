
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pff = soup.find('div', id='pff')

# 3. Materiality
found_ml = False
for div in pff.find_all('div', class_='t'):
    text = div.get_text(strip=True)
    if text == '5%':
        div.clear()
        div.string = '{{ materiality_level }}'
        found_ml = True
        break
print(f"Materiality replaced: {found_ml}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))
