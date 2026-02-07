import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# Page 10 (pfa in hex) content
pfa_start = content.find('id=\"pfa\"')
pfb_start = content.find('id=\"pfb\"')
if pfa_start != -1 and pfb_start != -1:
    pfa_content = content[pfa_start:pfb_start]
    # Look for customer/address related text
    if '고객' in pfa_content:
        idx = pfa_content.find('고객')
        print(f'Page 10 (pfa) - 고객 at offset {idx}:')
        print(pfa_content[max(0,idx-100):idx+500])

# Page 15 (pff in hex) content
pff_start = content.find('id=\"pff\"')
pf10_start = content.find('id=\"pf10\"')
if pff_start != -1 and pf10_start != -1:
    pff_content = content[pff_start:pf10_start]
    # Look for assurance level
    if '보증수준' in pff_content:
        idx = pff_content.find('보증수준')
        print(f'Page 15 (pff) - 보증수준 at offset {idx}:')
        print(pff_content[max(0,idx-100):idx+500])

# Page 16 (pf10 in hex) content  
pf10_start = content.find('id=\"pf10\"')
pf11_start = content.find('id=\"pf11\"')
if pf11_start == -1:
    pf11_start = len(content)
if pf10_start != -1:
    pf10_content = content[pf10_start:pf11_start]
    if '해당' in pf10_content:
        idx = pf10_content.find('해당')
        print(f'Page 16 (pf10) - 해당 at offset {idx}:')
        print(pf10_content[max(0,idx-100):idx+500])
