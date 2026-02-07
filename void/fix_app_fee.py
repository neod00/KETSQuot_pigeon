
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

# Replace the entire content of the div containing "면제"
# Original: <div class="t m0 x1a h10 ya2 ff5 fs7 fc0 sc0 ls7 ws4">면제<span class="ff2 ls44">(<span class="lsa ws1c">720<span class="ls7 ws8">,000)</span></span></span></div>
page4 = re.sub(r'<div class="t m0 x1a h10 ya2 ff5 fs7 fc0 sc0 ls7 ws4">.*?</div>',
               '<div class="t m0 x1a h10 ya2 ff5 fs7 fc0 sc0 ls7 ws4">{{ application_fee_text }}</div>',
               page4)

new_content = content[:pf4_start] + page4 + content[pf5_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed application_fee_text replacement.")
