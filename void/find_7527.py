
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf1_start = content.find('id="pf1"')
pf2_start = content.find('id="pf2"')
page1 = content[pf1_start:pf2_start]

if '7527' in page1:
    idx = page1.find('7527')
    print(f"FOUND 7527 at {idx}")
    print(f"CONTEXT: {page1[idx-100:idx+100]}")
else:
    print("7527 NOT FOUND in Page 1")
    # Search whole file
    if '7527' in content:
        idx = content.find('7527')
        print(f"FOUND 7527 in whole file at {idx}")
        print(f"CONTEXT: {content[idx-100:idx+100]}")
