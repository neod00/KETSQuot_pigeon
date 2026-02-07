
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

vars_to_check = ['{{ stage1_cost }}', '{{ stage2_cost }}', '{{ stage3_cost }}', '{{ total_cost }}', '{{ final_cost }}']
for v in vars_to_check:
    if v in page4:
        print(f"Found {v}")
    else:
        print(f"NOT FOUND {v}")
