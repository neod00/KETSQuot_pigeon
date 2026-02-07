
import os
from bs4 import BeautifulSoup

def extract_page_text(file_path, page_id):
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    page_div = soup.find('div', id=page_id)
    
    if not page_div:
        return f"Page {page_id} not found."
    
    # Extract all text segments within the page div
    texts = page_div.find_all(text=True)
    clean_texts = [t.strip() for t in texts if t.strip()]
    
    return "\n".join(clean_texts)

if __name__ == "__main__":
    target_file = r'd:\OneDrive\Business\ai automation\LRQA_AutoQuot\KETSQuot\LRQA_GHGP_contract.html'
    page1_text = extract_page_text(target_file, 'pf1')
    print("--- Page 1 Text ---")
    print(page1_text)
