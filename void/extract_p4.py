
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='cp949') as f:
        html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')
pf4 = soup.find('div', id='pf4')

if pf4:
    # Extract only visible text with basic prettifying
    text = pf4.get_text(separator='\n', strip=True)
    with open('p4_text.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    
    # Also save a pretty version of the HTML for pf4 to see structure
    with open('p4_pretty.txt', 'w', encoding='utf-8') as f:
        f.write(pf4.prettify())
    
    print("Page 4 text and structure extracted.")
else:
    print("Page 4 (pf4) not found.")
