import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target Page 10 (pfa) part
# The current structure:
# <span class="ff4 ws14">주소</span></div></div><div class="t m0 x1 h10" style="letter-spacing: normal !important; word-spacing: normal !important;">{{ hq_address }}</div>

target = r'<span class="ff4 ws14">주소</span></div></div><div class="t m0 x1 h10" style="letter-spacing: normal !important; word-spacing: normal !important;">{{ hq_address }}</div>'
replacement = r'<span class="ff4 ws14">주소: </span><span style="letter-spacing: normal !important; word-spacing: normal !important;">{{ hq_address }}</span></div></div>'

if target in content:
    new_content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fix applied: HQ Address moved inside the label container on Page 10.")
else:
    print("Target string not found in template.ts. Checking for variations...")
    # Try a more flexible search
    pattern = r'본사</span>.*?주소</span></div></div>.*?{{ hq_address }}.*?</div>'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        print("Found with fuzzy pattern.")
        # We need to be careful with the replacement to maintain the tags
        # Let's just use the exact string I saw in p10_chunk.html if possible
        pass
    else:
        print("Fuzzy pattern failed too.")
