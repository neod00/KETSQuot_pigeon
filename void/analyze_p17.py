import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# Find page 17 (pf11) and examine the signature table
pf11_start = content.find('id="pf11"')
if pf11_start != -1:
    segment = content[pf11_start:pf11_start+15000]
    
    print("=== PAGE 17 SIGNATURE TABLE ANALYSIS ===")
    
    # Find all occurrences of key labels
    for label in ['서명', '직책', '성명', '일자', 'SIGNED by', 'client_representative']:
        for m in re.finditer(label, segment):
            print(f'\n{label} at offset {m.start()}:')
            print(segment[m.start():m.start()+300])
            print('-' * 50)

# Also check if '2026년 12월 31일' specific pattern exists (for deadline)
print("\n=== DEADLINE CHECK ===")
# The deadline appears fragmented as "2026 01... 12... 일"
# We need to find the complete date pattern on page 15, not page 17
pff_start = content.find('id="pff"')
pf10_start = content.find('id="pf10"')
if pff_start != -1:
    pff_segment = content[pff_start:pf10_start]
    # Look for "2026"
    for m in re.finditer('2026', pff_segment):
        print(f'\n2026 in page 15 at offset {m.start()}:')
        print(pff_segment[max(0,m.start()-50):m.start()+200])
