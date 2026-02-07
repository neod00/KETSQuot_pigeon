
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf11_start = content.find('id="pf11"')
page_11 = content[pf11_start:]
print(page_11[page_11.find('직책'):page_11.find('직책')+500])
