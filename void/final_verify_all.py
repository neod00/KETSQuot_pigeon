import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Final Verification:")

# 1. Page 15
if '{{ reporting_deadline }}' in content:
    print("[OK] Page 15: {{ reporting_deadline }} found.")
else:
    print("[FAIL] Page 15: {{ reporting_deadline }} NOT found.")

# 2. Page 17 Labels
# Check for "서명:", "직책:", "성명:", "일자:" on Page 17 segment
start = content.find('id="pf11"')
segment = content[start:]

labels = ['서명', '직책', '성명', '일자']
for label in labels:
    # Use fuzzy search for labels because of span tags
    if label in segment:
        print(f"[OK] Page 17: Label '{label}' found.")
    else:
        print(f"[FAIL] Page 17: Label '{label}' NOT found.")

# 3. Page 17 Placeholders
placeholders = ['{{ client_representative_name }}', '{{ client_representative_title }}', '{{ proposal_date_korean_long }}']
for p in placeholders:
    if p in segment:
        print(f"[OK] Page 17: Placeholder '{p}' found.")
    else:
        print(f"[FAIL] Page 17: Placeholder '{p}' NOT found.")

# 4. Page 3 / 10
if '{{ hq_address }}' in content:
    print("[OK] Page 10: {{ hq_address }} found.")
if '{{ target_sites }}' in content:
    print("[OK] Page 3: {{ target_sites }} found.")
