
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pff_start = content.find('id="pff"')
pf10_start = content.find('id="pf10"')
page_f = content[pff_start:pf10_start]

# Replace 5% specifically in the context of the table on Page 15
page_f = page_f.replace('>5%<', '>{{ materiality_level }}<')

new_content = content[:pff_start] + page_f + content[pf10_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Final adjustment for Page 15.")
