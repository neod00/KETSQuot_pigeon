
from bs4 import BeautifulSoup

file_path = 'LRQA_GHGP_contract.html'
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='cp949') as f:
        html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')
pf3 = soup.find('div', id='pf3')

if pf3:
    # Extract only visible text with basic prettifying
    text = pf3.get_text(separator='\n', strip=True)
    with open('p3_text.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    
    # Also save a pretty version of the HTML for pf3 to see structure
    with open('p3_pretty.txt', 'w', encoding='utf-8') as f:
        f.write(pf3.prettify())
    
    print("Page 3 text and structure extracted.")
else:
    print("Page 3 (pf3) not found.")
