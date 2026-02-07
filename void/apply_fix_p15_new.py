import re

file_path = 'DataVerification_contract/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Page 15 'Assurance Level' Label Fix
# Look for the specific structure of "보증수준" in Page 15. 
# Note: The context might be slightly different if lines changed, but the HTML string itself should be intact.
# Based on previous analysis: <div class="c x1 y217 w24 h25"><div style="letter-spacing: normal !important; word-spacing: normal !important; letter-spacing: normal !important; word-spacing: normal !important;">보증수준<span style="letter-spacing: normal !important; word-spacing: normal !important; letter-spacing: normal !important; word-spacing: normal !important;" class="ff3 ws8"> </span></div></div>

# We will use a regex that is flexible enough to catch it even if attributes reordered, but specific enough.
# The surrounding div has y217.
label_pattern = r'<div class="c x1 y217 w24 h25"><div[^>]*>보증수준.*?</div></div>'
label_replacement = '<div class="c x1 y217 w24 h25"><div class="t m0 x10 hf y7d ff4 fs1 fc0 sc0 ls7 ws2" style="font-weight: 700 !important; letter-spacing: normal !important; word-spacing: normal !important;">보증수준</div></div>'

new_content, count = re.subn(label_pattern, label_replacement, content)

if count > 0:
    print(f"Fixed 'Assurance Level' label. Replaced {count} instance(s).")
else:
    print("Warning: Could not find 'Assurance Level' label with the expected pattern.")
    # Fallback debug: print what is at y217
    print("Searching for y217 context:")
    y217_matches = re.findall(r'<div class="c [^"]*y217[^"]*">.*?</div></div>', content)
    for m in y217_matches:
        print(m)

# 2. Assurance Level Value Fix (Bold)
# Ensure the value {{ assurance_level }} is also bold if not already.
# Previous analysis showed: <div class="c x39 y217 w25 h25"><div style="..." ...>{{ assurance_level }}</div></div>
# We want to force font-weight: 700 on the inner div if it lacks it.

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
    print("Warning: Could not find 'Assurance Level' value container to bold.")


# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
