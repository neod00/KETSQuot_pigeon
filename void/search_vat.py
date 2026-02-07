
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

print("Searching for VAT strings in Page 4:")
idx = page4.find('VAT')
while idx != -1:
    print(f"Match: {page4[idx:idx+100]}")
    idx = page4.find('VAT', idx + 1)

idx = page4.find('부')
while idx != -1:
    if '가세' in page4[idx:idx+20]:
         print(f"VAT Note context: {page4[idx-10:idx+60]}")
    idx = page4.find('부', idx + 1)
