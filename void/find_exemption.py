
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

idx = page4.find('면제')
if idx != -1:
    print(page4[idx-50:idx+200])
else:
    print("면제 not found in Page 4 HTML")
