
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf1_start = content.find('id="pf1"')
pf2_start = content.find('id="pf2"')
page1 = content[pf1_start:pf2_start]

for s in ['7', '5', '2', '527', '75']:
    print(f"'{s}' in page1: {s in page1}")
    if s in page1:
        idx = page1.find(s)
        print(f"  Context: {page1[idx-10:idx+20]}")
