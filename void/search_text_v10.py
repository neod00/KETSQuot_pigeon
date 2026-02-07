import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p2 date 
print("P2 date search:")
idx_p2 = content.find('id="pf2"')
if idx_p2 != -1:
    idx_p2_date = content.find('{{ proposal_date }}', idx_p2, idx_p2 + 5000)
    if idx_p2_date != -1:
        print(f"P2 date found at {idx_p2_date}")

# p6 date
print("P6 date search:")
idx_p6 = content.find('id="pf6"')
if idx_p6 != -1:
    idx_p6_date = content.find('{{ proposal_date }}', idx_p6, idx_p6 + 10000)
    if idx_p6_date != -1:
        print(f"P6 date found at {idx_p6_date}")

# p17 Table Analysis - let's search for "Korea Limited" to find the right side
idx_kl = content.find("Korea Limited")
if idx_kl != -1:
    print(f"Korea Limited found at {idx_kl}: {content[idx_kl-100:idx_kl+2000]}")

