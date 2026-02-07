import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# Find page 10 (pfa) and look at the address section more closely
pfa_start = content.find('id=\"pfa\"')
pfb_start = content.find('id=\"pfb\"')
if pfa_start != -1:
    pfa_content = content[pfa_start:pfb_start]
    # The screenshot shows '(2) 고객: 에이치앤컴퍼니' then '본사 주소' below it
    # Let's find the '본사' and '주소' pattern
    idx = pfa_content.find('본사')
    if idx != -1:
        print('Around 본사:')
        print(pfa_content[idx:idx+400])

# Also find page 15 (pff) for assurance_level
pff_start = content.find('id=\"pff\"')
pf10_start = content.find('id=\"pf10\"')
if pff_start != -1:
    pff_content = content[pff_start:pf10_start]
    print('\\n\\nPage 15 vars check:')
    # Look for Table A
    if 'Table A' in pff_content:
        idx = pff_content.find('Table A')
        print(pff_content[idx:idx+800])
