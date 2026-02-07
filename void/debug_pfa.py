import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# Search for text on page 10 (pfa) around customer area
pfa_start = content.find('id=\"pfa\"')
pfb_start = content.find('id=\"pfb\"')
if pfa_start != -1:
    pfa_content = content[pfa_start:pfb_start]
    # Find the text '본사 주소' or where it should be
    if '본사' in pfa_content:
        for m in re.finditer('본사', pfa_content):
            print(f'본사 at {m.start()}: {pfa_content[m.start()-50:m.start()+200]}')
    # Also look for company_name placeholder on this page
    if 'company_name' in pfa_content:
        idx = pfa_content.find('company_name')
        print(f'company_name at {idx}: {pfa_content[idx-100:idx+300]}')
