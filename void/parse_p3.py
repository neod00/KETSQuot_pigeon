import re
with open('p3_raw.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all text elements and their positions
# pdf2htmlEX: <div class="t m0 x... y... ff... fs... fc... sc... ls... ws...">TEXT</div>
matches = re.findall(r'<div[^>]*class="[^"]*t[^"]*"[^>]*>(.*?)</div>', html)
for m in matches[:20]:
    # clean tag
    text = re.sub(r'<[^>]*>', '', m)
    print(f"Text: {text}")

# Find table background lines
# Usually divs with class 'c' and border styles or h1 height (lines)
