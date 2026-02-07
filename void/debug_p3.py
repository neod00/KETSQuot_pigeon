
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf3_start = content.find('id="pf3"')
pf4_start = content.find('id="pf4"')
page3 = content[pf3_start:pf4_start]

search_terms = ['본사', '대상', '제한적', '합리적', '보증수준', '회사명']
for term in search_terms:
    count = page3.count(term)
    print(f"Term: {term}, Count: {count}")
    if count > 0:
        idx = page3.find(term)
        # Show more context
        print(f"  Context: {page3[idx-50:idx+150]}")
        print("-" * 20)
