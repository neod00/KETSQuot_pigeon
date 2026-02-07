
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

# More flexible regex for the VAT note
page4 = re.sub(r'부<span class="_ _4"></span>가세<span class="ff2">\(VAT\)</span>가<span class="ff2 ls4a ws8">[^<]*</span>별도이며',
               '{{ vat_note_text }}',
               page4)

new_content = content[:pf4_start] + page4 + content[pf5_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Applied flexible VAT note fix.")
