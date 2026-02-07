
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf10 = soup.find('div', id='pf10')

# 1. Project days in sentence
found_days_text = False
for div in pf10.find_all('div', class_='t'):
    if '소요될 것이다' in div.get_text():
        # Look for the preceding "5.0" fragments or replace the whole thing if it's together
        # Actually in pdf2htmlEX, numbers are often in their own div.
        pass

# Since regex might have failed due to unexpected spaces, let's use BS4 to find the exact text
all_texts = [div.get_text() for div in pf10.find_all('div', class_='t')]
print("--- Page 16 Text List ---")
for t in all_texts:
    if any(x in t for x in ['5.0', '6.0', '8,000', '2026']):
        print(f"Match: '{t}'")

# Based on inspection, if regex failed, it's usually because of <span> segments.
