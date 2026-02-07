import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target for label "보증수준"
# Current: <div class="c x1 y217 w24 h25"><div style="letter-spacing: normal !important; word-spacing: normal !important; letter-spacing: normal !important; word-spacing: normal !important;">보증수준<span style="letter-spacing: normal !important; word-spacing: normal !important; letter-spacing: normal !important; word-spacing: normal !important;" class="ff3 ws8"> </span></div></div>
target_label = '<div class="c x1 y217 w24 h25"><div style="letter-spacing: normal !important; word-spacing: normal !important; letter-spacing: normal !important; word-spacing: normal !important;">보증수준<span style="letter-spacing: normal !important; word-spacing: normal !important; letter-spacing: normal !important; word-spacing: normal !important;" class="ff3 ws8"> </span></div></div>'

# Replacement: Use the same classes as "중요성 기준" (ff4 fs1) and add bold
# Also add ":" to match context if needed, but user didn't explicitly ask for ":" for Assurance Level, 
# however the image shows "중요성 기준:" with a colon. 
# Looking at the image, "보증수준" does NOT have a colon.
# Let's just fix font/size/bold.
replacement_label = '<div class="c x1 y217 w24 h25"><div class="t m0 x10 hf y7d ff4 fs1 fc0 sc0 ls7 ws2" style="font-weight: 700 !important; letter-spacing: normal !important; word-spacing: normal !important;">보증수준</div></div>'

if target_label in content:
    content = content.replace(target_label, replacement_label)
    print("Fix applied for '보증수준' label styling.")
else:
    print("Target label HTML not found. Trying fuzzy search...")
    # Use regex to find it
    pattern = r'<div class="c x1 y217 w24 h25"><div[^>]*>보증수준.*?</div></div>'
    new_content, count = re.subn(pattern, replacement_label, content)
    if count > 0:
        content = new_content
        print(f"Fix applied using fuzzy search ({count} occurrences).")
    else:
        print("Failed to find '보증수준' label.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
