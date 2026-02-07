
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

# Previous variables were already applied by template_p4.py and fix_p4_vars.py
# Let's add VAT type and note.

# Find "VAT 별도" - it appears multiple times.
# 1. Row 51/56 (Total row)
# 2. Row 64/65 (Final row)
page4 = page4.replace('VAT<span class="ff5 ws4"> 별도</span>', 'VAT {{ vat_type }}')
page4 = page4.replace('VAT<span class="ff4 ws1d"> 별도</span>', 'VAT {{ vat_type }}')

# Note: 상기 비용은 부 가세 (VAT) 가 별도이며
# <span class="ls7 wsf">부<span class="_ _4"></span>가세<span class="ff2">(VAT)</span>가<span class="ff2 ls4a ws8"></span>별도이며</span>
page4 = re.sub(r'부<span class="_ _4"></span>가세<span class="ff2">\(VAT\)</span>가<span class="ff2 ls4a ws8"></span>별도이며',
               '{{ vat_note_text }}',
               page4)

new_content = content[:pf4_start] + page4 + content[pf5_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Added VAT variables to Page 4")
