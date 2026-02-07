import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Page 15 'Assurance Level' Label Fix
label_pattern = r'<div class="c x1 y217 w24 h25"><div[^>]*>보증수준.*?</div></div>'
label_replacement = '<div class="c x1 y217 w24 h25"><div class="t m0 x10 hf y7d ff4 fs1 fc0 sc0 ls7 ws2" style="font-weight: 700 !important; letter-spacing: normal !important; word-spacing: normal !important;">보증수준</div></div>'

new_content, count = re.subn(label_pattern, label_replacement, content)

if count > 0:
    print(f"Fixed 'Assurance Level' label. Replaced {count} instance(s).")
else:
    print("Warning: Could not find 'Assurance Level' label.")

# 2. Assurance Level Value Fix (Bold)
value_pattern = r'(<div class="c [^"]*?y217[^"]*?"><div [^>]*?style=")([^"]*?)(".*?>\{\{ assurance_level \}\}.*?</div></div>)'
def make_bold(match):
    prefix = match.group(1)
    style = match.group(2)
    suffix = match.group(3)
    if 'font-weight: 700' not in style:
        new_style = style + ' font-weight: 700 !important;'
        return prefix + new_style + suffix
    return match.group(0)

new_content, val_count = re.subn(value_pattern, make_bold, new_content)
if val_count > 0:
    print(f"Ensured 'Assurance Level' value is bold. Updated {val_count} instance(s).")
else:
    print("Warning: Could not find 'Assurance Level' value container.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
