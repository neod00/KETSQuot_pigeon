import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# === FIX 1: Page 10 (pfa) - Add hq_address after "본사 주소" ===
# Replace '주소</span></div></div>' with '주소</span></div></div><div class="t m0 x1 h10">{{ hq_address }}</div>'
# Actually, we need to find where the address should actually go. The text says "본사 주소" and then
# there should be an empty placeholder or the actual address below.

# Let's find the exact pattern on page 10 (pfa)
pfa_start = content.find('id="pfa"')
pfb_start = content.find('id="pfb"')
pfa_segment = content[pfa_start:pfb_start]

# The pattern seems to be 주소</span></div></div><div class="c x0 y3...
# We need to insert {{ hq_address }} right after 주소
target_p10 = '주소</span></div></div><div class="c x0 y3'
if target_p10 in content:
    replacement = '주소</span></div></div><div class="t m0 x1 h10" style="letter-spacing: normal !important; word-spacing: normal !important;">{{ hq_address }}</div><div class="c x0 y3'
    content = content.replace(target_p10, replacement, 1)
    print('Fix 1 applied: hq_address on Page 10')
else:
    print('Fix 1: Target pattern not found')

# === FIX 2: Page 15 (pff) - assurance_level font styling ===
# Make assurance_level bold like 중요성 기준
# Find {{ assurance_level }} and wrap with bold styling
if '{{ assurance_level }}' in content:
    content = content.replace(
        '{{ assurance_level }}',
        '<span style="font-weight: 700 !important;">{{ assurance_level }}</span>'
    )
    print('Fix 2a applied: assurance_level bold styling')

# === FIX 2b: Add reporting_deadline ===
# Find '2026년 12월 31일' and replace with {{ reporting_deadline }}
# Search for variations
if '2026년 12월 31일' in content:
    content = content.replace('2026년 12월 31일', '{{ reporting_deadline }}')
    print('Fix 2b applied: reporting_deadline placeholder')
else:
    # Try to find fragmented version
    idx = content.find('2026')
    if idx != -1:
        print(f'2026 found at {idx}, checking context...')
        # Print surrounding text
        print(content[idx-50:idx+150])

# === FIX 3: Page 16 (pf10) - spacing in sentence ===
# The sentence "해당 프로젝트는 {{ total_days }} 일이 소요될 것이다..." has spacing issues
# Apply normal spacing
target_p16 = '해당 프로젝트는 {{ total_days }} 일이 소요될 것이다'
if target_p16 in content:
    replacement = '<span style="letter-spacing: normal !important; word-spacing: normal !important;">해당 프로젝트는 {{ total_days }} 일이 소요될 것이다</span>'
    content = content.replace(target_p16, replacement)
    print('Fix 3 applied: P16 sentence spacing')
else:
    print('Fix 3: Target sentence not found in expected format')
    # Check if it exists at all
    if '해당' in content and 'total_days' in content:
        print('Both 해당 and total_days exist but not in expected format')

# === FIX 4: Page 17 (pf11) - ensure signature labels are static ===
# The issue is that labels like 서명:, 직책:, 성명:, 일자: on the LEFT side (customer side)
# should be static, not variables. Let's check if they were accidentally replaced.
# From the screenshot, it seems the LEFT side has:
#   서명: (empty)
#   대표이사 (this should be 직책: label, followed by client_representative_title)
#   김달 대 (this should be 성명: label, followed by client_representative_name)
#   일자: 2026 01 월 12 일
# This suggests the LABELS themselves got replaced. Let's restore them.

# Actually looking at the screenshot more carefully:
# LEFT column header: "SIGNED by 에이치앤컴퍼니" 
# Then rows: 서명:, 대표이사, 김달 대, 일자: 2026...
# The labels should be 서명:, 직책:, 성명:, 일자:
# But it shows 대표이사 (which is the client_representative_title value)
# This means the label was accidentally replaced with the value.

# We need to find where this happened and fix it.
# Let's just ensure the labels exist correctly.
# I'll search for the structure and fix if needed.

pf11_start = content.find('id="pf11"')
if pf11_start != -1:
    segment = content[pf11_start:pf11_start+10000]
    # Check for proper labels
    if '직책:' in segment and '성명:' in segment:
        print('Fix 4: Signature labels appear correct')
    else:
        print('Fix 4: Need to check/fix signature labels')
        # Let's see what's there
        if '직책' in segment:
            idx = segment.find('직책')
            print(f'직책 context: {segment[idx:idx+200]}')

# Save the file
with open('web-app/src/constants/template.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nTemplate fixes applied and saved.')
