import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# === FIX 1: Page 10 (pfa) - Add hq_address after "본사 주소" ===
# Find "본사</span>...주소</span>" and add {{ hq_address }} after it
# We need to find where "본사 주소" appears and ensure {{ hq_address }} follows

# First, let's check if there's already a placeholder or if we need to add one
pfa_start = content.find('id="pfa"')
pfb_start = content.find('id="pfb"')
pfa_content = content[pfa_start:pfb_start]

# The structure seems to be: 본사</span>...주소</span></div></div>
# We need to insert the address placeholder after "주소"
# Let's find the exact pattern
idx_bonsa = pfa_content.find('본사')
if idx_bonsa != -1:
    # Find where we need to insert hq_address
    idx_juso = pfa_content.find('주소', idx_bonsa)
    if idx_juso != -1:
        print(f'Found 본사 at {idx_bonsa}, 주소 at {idx_juso}')
        print('Context around 주소:')
        print(pfa_content[idx_juso:idx_juso+500])

# === FIX 2: Page 15 (pff) - assurance_level and reporting_deadline ===
pff_start = content.find('id="pff"')
pf10_start = content.find('id="pf10"')
pff_content = content[pff_start:pf10_start]

# Find assurance_level placeholder
idx_assurance = pff_content.find('{{ assurance_level }}')
if idx_assurance != -1:
    print(f'\n\nassurance_level placeholder at {idx_assurance}')
    print(pff_content[max(0,idx_assurance-200):idx_assurance+300])

# Find "2026년 12월 31일" for reporting_deadline
idx_deadline = content.find('2026년 12월 31일')
if idx_deadline != -1:
    print(f'\n\n2026년 12월 31일 at {idx_deadline}')
    print(content[max(0,idx_deadline-100):idx_deadline+200])
else:
    # Maybe it's fragmented?
    idx_2026 = content.find('2026')
    print(f'\n\n2026 found at {idx_2026}')
    if idx_2026 != -1:
        print(content[idx_2026:idx_2026+200])

# === FIX 3: Page 16 (pf10) - spacing ===
pf10_start = content.find('id="pf10"')
pf11_start = content.find('id="pf11"')
pf10_content = content[pf10_start:pf11_start]

# Find total_days placeholder
idx_days = pf10_content.find('{{ total_days }}')
if idx_days != -1:
    print(f'\n\ntotal_days placeholder at {idx_days}')
    print(pf10_content[max(0,idx_days-100):idx_days+300])

# === FIX 4: Page 17 (pf11) - signature table ===
pf11_start = content.find('id="pf11"')
pf11_content = content[pf11_start:]

# Find signature labels and check if they're placeholders or static
idx_sig = pf11_content.find('서명')
if idx_sig != -1:
    print(f'\n\n서명 at {idx_sig}')
    print(pf11_content[idx_sig:idx_sig+400])

# Find client_representative placeholders
for v in ['client_representative_title', 'client_representative_name']:
    idx = pf11_content.find(v)
    if idx != -1:
        print(f'\n\n{v} at {idx}')
        print(pf11_content[max(0,idx-200):idx+200])
