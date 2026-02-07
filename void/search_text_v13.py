import re

with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find Representative Director on p17
idx_rep = content.find("{{ client_representative_title }}")
if idx_rep != -1:
    print(f"Found client_representative_title at {idx_rep}: {content[idx_rep-500:idx_rep+500]}")

idx_date_p17 = content.find("{{ proposal_date_korean_long }}")
if idx_date_p17 != -1:
    print(f"Found proposal_date_korean_long at {idx_date_p17}: {content[idx_date_p17-300:idx_date_p17+300]}")

# p15 variables
idx_p15 = content.find('id="pf15"')
if idx_p15 != -1:
    idx_bo = content.find("{{ assurance_level }}")
    if idx_bo != -1:
        print(f"bo at {idx_bo}: {content[idx_bo-300:idx_bo+100]}")

