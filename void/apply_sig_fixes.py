import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Page 10 hq_address duplication/position if needed
# (Already looks okay from previous agent's summary, but let's double check)

# 2. Fix Page 17 Signature Table
# Find the start of the signature block
# Based on my view:
# <div class="c x1 y268 w2d h3a"><div class="t m0 x40 h9 y266 ff5 fs1 fc0 sc0 ls7 ws17">{{ client_representative_title }}</div></div>
# <div class="c x41 y268 w2e h3a"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8"> </div></div>

# Fixing Title row
target_title_row = re.compile(
    r'<div class="c x1 y268 w2d h3a"><div class="t m0 x40 h9 y266 ff5 fs1 fc0 sc0 ls7 ws17">\{\{ client_representative_title \}\}</div></div>\s*'
    r'<div class="c x41 y268 w2e h3a"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8"> </div></div>'
)
replacement_title_row = (
    '<div class="c x1 y268 w2d h3a"><div class="t m0 x40 h9 y266 ff5 fs1 fc0 sc0 ls7 ws17">직책<span class="ff2 ws8">: </span></div></div>\n'
    '<div class="c x41 y268 w2e h3a"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8" style="letter-spacing: normal !important; word-spacing: normal !important;">{{ client_representative_title }}</div></div>'
)

# Fixing Name row
target_name_row = re.compile(
    r'<div class="c x1 y269 w2d h41"><div\s+style="letter-spacing: normal; word-spacing: normal;" class="t m0 x40 h9 y266 ff5 fs1 fc0 sc0 ls7\s*">\{\{ client_representative_name \}\}</div></div>\s*'
    r'<div class="c x41 y269 w2e h41"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8"> </div></div>'
)
replacement_name_row = (
    '<div class="c x1 y269 w2d h41"><div class="t m0 x40 h9 y266 ff5 fs1 fc0 sc0 ls7 ws17">성명<span class="ff2 ws8">: </span></div></div>\n'
    '<div class="c x41 y269 w2e h41"><div class="t m0 x10 h9 y266 ff2 fs1 fc0 sc0 ls7 ws8" style="letter-spacing: normal !important; word-spacing: normal !important;">{{ client_representative_name }}</div></div>'
)

# Fixing Date row for Client
target_date_client = re.compile(
    r'<div class="c x41 y26a w2e h3a"><div class="t m0 x45 h9 y266 ff2 fs1 fc0 sc0 ls15f ws8">2026 01<span class="_ _12"> </span><span class="ff5 ls7 ws17">월</span><span class="ls7"> <span class="ls161 ws5e">12<span class="_"> </span></span><span class="ff5 ws17">일</span> </span></div></div>'
)
replacement_date_client = (
    '<div class="c x41 y26a w2e h3a"><div class="t m0 x45 h9 y266 ff2 fs1 fc0 sc0 ls15f ws8" style="letter-spacing: normal !important; word-spacing: normal !important;">{{ proposal_date_korean_long }}</div></div>'
)

# Fixing Date row for LRQA
target_date_lrqa = re.compile(
    r'<div class="c x8 y26a w30 h3a"><div class="t m0 x2d h9 y266 ff2 fs1 fc0 sc0 ls15f ws8">2026 01<span class="_ _12"> </span><span class="ff5 ls7 ws17">월</span><span class="ls7"> <span class="ls161 ws5e">12<span class="_"> </span></span><span class="ff5 ws17">일</span> </span></div></div>'
)
replacement_date_lrqa = (
    '<div class="c x8 y26a w30 h3a"><div class="t m0 x2d h9 y266 ff2 fs1 fc0 sc0 ls15f ws8" style="letter-spacing: normal !important; word-spacing: normal !important;">{{ proposal_date_korean_long }}</div></div>'
)

new_content = target_title_row.sub(replacement_title_row, content)
new_content = target_name_row.sub(replacement_name_row, new_content)
new_content = target_date_client.sub(replacement_date_client, new_content)
new_content = target_date_lrqa.sub(replacement_date_lrqa, new_content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Signature fixes applied')
else:
    print('No changes made - check patterns')
