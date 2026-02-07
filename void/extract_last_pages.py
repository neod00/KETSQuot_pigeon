
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')

def extract_page_hex(page_id):
    pf = soup.find('div', id=f'pf{page_id}')
    if pf:
        text = pf.get_text(separator=' ', strip=True)
        print(f"\n--- Page {page_id} ---")
        print(text[:1000])
    else:
        print(f"Page {page_id} not found.")

extract_page_hex('10')
extract_page_hex('11')
