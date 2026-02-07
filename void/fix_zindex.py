import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find the lines (background divs) near this area.
# Page 3 (pf3) elements start around y8c, y8d, etc.
# We'll look for divs with h1 classes (usually lines) or similar.

def make_bg_white(c):
    # Match the 'c' container for target_sites
    pattern = r'(<div[^>]*class="[^"]*c\s+xf\s+y8d\s+w11[^"]*")'
    match = re.search(pattern, c)
    if match:
        # Add background: white and z-index to cover underlying lines
        # Also remove overflow: hidden if it exists (usually in 'c' class)
        replacement = match.group(1) + ' style="background: white !important; z-index: 10 !important; overflow: visible !important;" '
        c = c.replace(match.group(1), replacement)
    return c

new_content = make_bg_white(content)
with open('web-app/src/constants/template.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
