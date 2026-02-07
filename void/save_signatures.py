
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')

def save_page_pretty(page_id):
    pf = soup.find('div', id=f'pf{page_id}')
    if pf:
        with open(f'page_{page_id}_pretty.txt', 'w', encoding='utf-8') as f:
            f.write(pf.prettify())
        print(f"Page {page_id} saved.")

save_page_pretty('a')
save_page_pretty('11')
