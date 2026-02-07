import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# Find page 10 (pfa) 
pfa_start = content.find('id="pfa"')
pfb_start = content.find('id="pfb"')
if pfa_start != -1:
    pfa_content = content[pfa_start:pfb_start]
    print(f'pfa length: {len(pfa_content)}')
    print(f'hq_address in pfa: {"hq_address" in pfa_content}')
    
    # Print a segment around the customer area
    print('\n--- Segment around "본사" ---')
    idx = pfa_content.find('본사')
    if idx != -1:
        print(pfa_content[idx:idx+400])
    
    # Also check for "주소"
    print('\n--- Segment around "주소" ---')
    idx2 = pfa_content.find('주소')
    if idx2 != -1:
        print(pfa_content[max(0,idx2-100):idx2+300])

# Find page 15 (pff) for assurance_level
pff_start = content.find('id="pff"')
pf10_start = content.find('id="pf10"')
if pff_start != -1:
    pff_content = content[pff_start:pf10_start]
    print('\n--- Page 15 (pff) check ---')
    print(f'pff length: {len(pff_content)}')
    
    # Look for assurance_level
    if 'assurance_level' in pff_content:
        idx = pff_content.find('assurance_level')
        print(f'assurance_level at {idx}')
        print(pff_content[max(0,idx-200):idx+200])
    
    # Look for '보증수준'
    if '보증수준' in pff_content:
        idx = pff_content.find('보증수준')
        print(f'\n보증수준 at {idx}')
        print(pff_content[max(0,idx-100):idx+400])

# Find page 16 (pf10) for spacing
print('\n--- Page 16 (pf10) check ---')
pf10_end = len(content)  # No pf11 exists
pf10_content = content[pf10_start:pf10_end]
print(f'pf10 length: {len(pf10_content)}')
if '해당 프로젝트는' in pf10_content:
    idx = pf10_content.find('해당 프로젝트는')
    print(f'해당 프로젝트는 at {idx}')
    print(pf10_content[max(0,idx-100):idx+400])

# Find page 17 - it's actually pf11 or we need to check what page 17 is
print('\n--- Looking for page 17 signature ---')
# Since pf10 is hex for 16, page 17 would be pf11
# But pf11 was not found. Let's see what's actually the last page
for i in range(10, 20):
    hex_id = hex(i)[2:]  # Convert to hex without '0x'
    if content.find(f'id="pf{hex_id}"') != -1:
        print(f'Page {i} (pf{hex_id}) exists')
