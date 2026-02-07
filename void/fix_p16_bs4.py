
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf10 = soup.find('div', id='pf10')

# 1. Project days in sentence
for div in pf10.find_all('div', class_='t'):
    text = div.get_text()
    if '해당 프로젝트는' in text and '소요될 것이다' in text:
        div.string = text.replace('5.0', '{{ total_days }}')
    elif 'Year 2026' in text:
        div.string = text.replace('2026', '{{ verification_year }}')
    elif '6.0 days' in text:
        div.string = text.replace('6.0', '{{ total_days }}')
    elif '8,000,000 원' in text:
        div.string = text.replace('8,000,000', '{{ final_cost }}')
    elif '면제 (720,000 원 )' in text or '면제' in text and '720,000' in text:
        # Check if it's the specific application fee line
        if '신청 수수료' in text or any('신청' in prev.get_text() for prev in div.find_previous_siblings()):
             div.string = '{{ application_fee_text }}'

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Applied variables to Page 16 using BeautifulSoup.")
