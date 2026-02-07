
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

# 1. VAT type in table
# Match: VAT <span class="ff5 ws4">별도</span>
page4 = page4.replace('VAT <span class="ff5 ws4">별도</span>', 'VAT {{ vat_type }}')
page4 = page4.replace('VAT <span class="ff4 ws1d">별도</span>', 'VAT {{ vat_type }}')

# 2. VAT note
# Note context: 부가세<span class="ff2">(VAT)</span>가<span class="ff2 ls4a ws8"> </span>별도이며
page4 = page4.replace('부가세<span class="ff2">(VAT)</span>가<span class="ff2 ls4a ws8"> </span>별도이며',
                      '{{ vat_note_text }}')

new_content = content[:pf4_start] + page4 + content[pf5_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Applied VAT fixes for Page 4")
