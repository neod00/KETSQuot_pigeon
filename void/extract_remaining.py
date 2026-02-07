
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')

def extract_page(page_no):
    pf = soup.find('div', id=f'pf{page_no}')
    if pf:
        text = pf.get_text(separator='\n', strip=True)
        with open(f'p{page_no}_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Page {page_no} extracted.")
    else:
        print(f"Page {page_no} not found.")

extract_page(5)
extract_page(6)
extract_page(7)
extract_page(8)
