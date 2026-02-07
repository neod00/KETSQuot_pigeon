import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# Find page 10 (pfa) and look at the full content
pfa_start = content.find('id=\"pfa\"')
pfb_start = content.find('id=\"pfb\"')
if pfa_start != -1:
    pfa_content = content[pfa_start:pfb_start]
    idx = pfa_content.find('\xeb\xb3\xb8\xec\x82\xac')  # 본사 in utf-8
    print(f'pfa length: {len(pfa_content)}')
    # Just look for hq_address - is it already there?
    if 'hq_address' in pfa_content:
        print('hq_address FOUND in pfa')
    else:
        print('hq_address NOT found in pfa')
    # Look for '주소'
    if '\xec\xa3\xbc\xec\x86\x8c' in pfa_content.encode() if isinstance(pfa_content, str) else True:
        if '주소' in pfa_content:
            idx = pfa_content.find('주소')
            print(f'주소 at {idx}')
            print(pfa_content[idx-100:idx+300] if idx > 100 else pfa_content[:idx+300])
