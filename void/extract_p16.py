
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')

def extract_page(page_id):
    pf = soup.find('div', id=f'pf{page_id}')
    if pf:
        text = pf.get_text(separator='\n', strip=True)
        with open(f'p{page_id}_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        
        with open(f'page_{page_id}_pretty.txt', 'w', encoding='utf-8') as f:
            f.write(pf.prettify())
        print(f"Page {page_id} extracted and saved.")
    else:
        print(f"Page {page_id} not found.")

extract_page('10')
