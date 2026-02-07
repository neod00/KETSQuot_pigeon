import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# Page 10 (pfa) - need to add hq_address after "본사 주소"
# The text "본사</span>...주소</span>" needs to be followed by {{ hq_address }}

# Page 15 (pff) - assurance_level styling and reporting_deadline
pff_start = content.find('id="pff"')
pf10_start = content.find('id="pf10"')
if pff_start != -1 and pf10_start != -1:
    pff_content = content[pff_start:pf10_start]
    print(f'Page 15 length: {len(pff_content)}')
    
    # Look for "보증수준" and "중요성 기준"
    if '보증수준' in pff_content:
        idx = pff_content.find('보증수준')
        print(f'\n보증수준 found at offset {idx}:')
        print(pff_content[idx:idx+300])
    
    if '중요성' in pff_content:
        idx = pff_content.find('중요성')
        print(f'\n중요성 found at offset {idx}:')
        print(pff_content[idx:idx+300])
    
    # Check for deadline
    if '2026' in pff_content:
        idx = pff_content.find('2026')
        print(f'\n2026 found at offset {idx}:')
        print(pff_content[max(0,idx-100):idx+300])

# Page 16 (pf10) - spacing issue
pf10_start = content.find('id="pf10"')
pf11_start = content.find('id="pf11"')
if pf10_start != -1 and pf11_start != -1:
    pf10_content = content[pf10_start:pf11_start]
    print(f'\nPage 16 length: {len(pf10_content)}')
    
    if '해당' in pf10_content:
        idx = pf10_content.find('해당')
        print(f'\n해당 found at offset {idx}:')
        print(pf10_content[idx:idx+500])

# Page 17 (pf11) - signature table
pf11_start = content.find('id="pf11"')
if pf11_start != -1:
    pf11_content = content[pf11_start:]
    print(f'\nPage 17 length: {len(pf11_content)}')
    
    # Look for signature labels
    for label in ['서명', '직책', '성명', '일자']:
        if label in pf11_content:
            idx = pf11_content.find(label)
            print(f'\n{label} found at offset {idx}:')
            print(pf11_content[idx:idx+300])
