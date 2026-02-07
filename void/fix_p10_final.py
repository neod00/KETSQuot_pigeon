import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target string on Page 10 (pfa)
# Current: <div class="c x1 y186 w1a h46"><div class="t m0 x2a h28 y182 ff3 fsd fc0 sc0 ls7 ws15"><span class="ff4 ws14">본사</span><span class="ls32 ws8"> </span><span class="ff4 ws14">주소: </span><span style="letter-spacing: normal !important; word-spacing: normal !important;">{{ hq_address }}</span></div></div>
target = '<div class="c x1 y186 w1a h46"><div class="t m0 x2a h28 y182 ff3 fsd fc0 sc0 ls7 ws15"><span class="ff4 ws14">본사</span><span class="ls32 ws8"> </span><span class="ff4 ws14">주소: </span><span style="letter-spacing: normal !important; word-spacing: normal !important;">{{ hq_address }}</span></div></div>'

# Replacement: Label in container, Value outside to avoid clipping (h46 is too short)
# Coordinates for y186: bottom: 688.42px
# Coordinates for x1: left: 0px (but label x2a is 35.4px)
replacement = '<div class="c x1 y186 w1a h46"><div class="t m0 x2a h28 y182 ff3 fsd fc0 sc0 ls7 ws15"><span class="ff4 ws14">본사 주소:</span></div></div><div class="t m0 x1 h10" style="bottom: 688.5px; left: 110px; width: 450px; white-space: pre-wrap; letter-spacing: normal !important; word-spacing: normal !important; line-height: 1.2;">{{ hq_address }}</div>'

if target in content:
    content = content.replace(target, replacement)
    print("Fix applied for 'hq_address' with absolute positioning and clipping fix.")
else:
    print("Target not found. Looking for structural match...")
    # Use regex for more flexibility
    pattern = r'<div class="c x1 y186 w1a h46"><div class="t m0 x2a h28 y182 ff3 fsd fc0 sc0 ls7 ws15"><span class="ff4 ws14">본사</span>.*?{{ hq_address }}.*?</div></div>'
    new_content, count = re.subn(pattern, replacement, content)
    if count > 0:
        content = new_content
        print(f"Fix applied using regex ({count} occurrences).")
    else:
        print("Failed to find target structure on Page 10.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
