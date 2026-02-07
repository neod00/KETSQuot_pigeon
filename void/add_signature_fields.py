
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf11_start = content.find('id="pf11"')
page_11 = content[pf11_start:]

# Fill empty divs for customer signature block
# Based on the structure:
# <div class="c x41 y268 w2e h3a"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8"></div></div>
page_11 = page_11.replace('<div class="c x41 y268 w2e h3a"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8"></div></div>',
                          '<div class="c x41 y268 w2e h3a"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8">{{ client_representative_title }}</div></div>')

page_11 = page_11.replace('<div class="c x41 y269 w2e h41"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8"></div></div>',
                          '<div class="c x41 y269 w2e h41"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8">{{ client_representative_name }}</div></div>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content[:pf11_start] + page_11)

print("Added client signature variables to Page 17.")
