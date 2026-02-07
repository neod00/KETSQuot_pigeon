import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 'target_sites' is inside a div with class 'c xf y8d w11 h2b'
# Based on the screenshot, it's overlapping the bottom border. 
# pdf2htmlEX puts lines as separate divs.
# To truly "expand", we need to push everything below it down.
# Since we can't easily recalculate all 'y' positions, 
# we can TRY to make the container overflow: visible and the parent .pf container height: auto.
# But Next.js/Browser print might behave differently.

# Method:
# 1. Find the target_sites area.
# 2. Add a style to the text container to allow it to grow.
# 3. Add a background cover (already tried, but maybe needs better styling).

# Let's try to wrap the value in a white div that spans wide and 
# doesn't have a height limit, and relative positioning.

def final_attempt_fix(c):
    # Find the specific div for target_sites
    # <div style="..." class="t m0 x10 h9 y8c ...">{{ target_sites }}</div>
    
    # We will replace the whole cell container to be more robust.
    # The cell is defined by <div ... class="c xf y8d w11 h2b">
    
    pattern = r'<div[^>]*class="[^"]*c\s+xf\s+y8d\s+w11\s+h2b[^"]*"[^>]*>(.*?)</div>'
    match = re.search(pattern, c, re.S)
    if match:
        inner_content = match.group(1)
        # Create a new structure: overflow visible, background white, relative height.
        # We use min-height of the original cell (h2b is usually ~20-30px)
        new_cell = (
            '<div style="background: white !important; z-index: 100 !important; '
            'height: auto !important; min-height: 22px !important; overflow: visible !important; '
            'position: absolute !important; display: block !important;" '
            'class="c xf y8d w11">' + inner_content + '</div>'
        )
        c = c.replace(match.group(0), new_cell)
        print("Replaced outer cell structure")

    # Also fix the inner 't' div which has fixed 'y' and 'h'
    # Pattern: <div style="..." class="t m0 x10 h9 y8c ...">
    pattern_inner = r'(<div[^>]*class="[^"]*t\s+m0\s+x10\s+h9\s+y8c[^"]*")'
    match_inner = re.search(pattern_inner, c)
    if match_inner:
        replacement_inner = match_inner.group(1) + ' style="position: relative !important; top: 0 !important; height: auto !important; display: block !important;" '
        c = c.replace(match_inner.group(1), replacement_inner)
        print("Replaced inner text structure")
        
    return c

new_content = final_attempt_fix(content)
with open('web-app/src/constants/template.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
