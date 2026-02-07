
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

print("Checking audit_rate placeholder:")
if '{{ audit_rate }}' in page4:
    idx = page4.find('{{ audit_rate }}')
    print(f"Found: {page4[idx-50:idx+100]}")
else:
    print("audit_rate placeholder NOT FOUND")

print("\nChecking for remaining 1,350,000:")
if '1,350,000' in page4:
    idx = page4.find('1,350,000')
    print(f"Found static 1,350,000: {page4[idx-50:idx+100]}")
else:
    print("No static 1,350,000 found")
