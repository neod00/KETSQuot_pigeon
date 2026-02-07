import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for the customer name placeholder on p10 to find address nearby
p10_id = content.find('id="pf10"')
if p10_id != -1:
    idx_p10_comp = content.find('{{ company_name }}', p10_id, p10_id + 10000)
    if idx_p10_comp != -1:
        print(f"P10 company name found at {idx_p10_comp}: {content[idx_p10_comp-100:idx_p10_comp+500]}")

# p15 variables
idx_p15 = content.find('id="pf15"')
if idx_p15 != -1:
    idx_level = content.find('{{ assurance_level }}', idx_p15, idx_p15 + 15000)
    if idx_level != -1:
        print(f"P15 assurance_level found at {idx_level}: {content[idx_level-200:idx_level+100]}")
    idx_mat = content.find('{{ materiality_level }}', idx_p15, idx_p15 + 15000)
    if idx_mat != -1:
        print(f"P15 materiality_level found at {idx_mat}: {content[idx_mat-200:idx_mat+100]}")

# p17 Table Analysis
# The signature table has '서명:', '직책:', '성명:', '일자:'
# We need to make sure the left side (Customer side) has these labels static.
idx_p17 = content.find('id="pf17"')
if idx_p17 != -1:
    idx_sig_label = content.find('서명:', idx_p17)
    if idx_sig_label != -1:
        print(f"Found 서명: at {idx_sig_label}")
        print(content[idx_sig_label-200:idx_sig_label+2000])

