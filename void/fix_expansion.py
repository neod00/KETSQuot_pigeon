import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the container div with height class h2b and y-position y8d (based on the snippet)
# Snippet: ... class="c xf y8d w11 h2b"><div style="..." ... {{ target_sites }} ...

pattern = r'(<div[^>]*class="[^"]*c\s+xf\s+y8d\s+w11\s+h2b[^"]*"[^>]*>)(.*?{{ target_sites }}.*?)(</div>)'
# Actually, the snippets showed:
# ... class="c xf y8d w11 h2b"><div style="letter-spacing: normal !important; word-spacing: normal !important;" class="t m0 x10 h9 y8c ff5 fs1 fc0 sc0 ls7 ws17"> ... {{ target_sites }} ...

# Let's try to match the parent container 'c' div and the inner 't' div
# and remove fixed height from both.

def fix_table_expansion(c):
    # 1. Broad fix: For divs containing target_sites, remove height classes and set auto height
    # Container 'c' usually has hXX class.
    # Inner 't' usually has hX class.
    
    # Matches the 'c' div containing target_sites
    pattern = r'(<div[^>]*class="[^"]*c\s+xf\s+y8d\s+w11\s+h2b[^"]*")'
    match = re.search(pattern, c)
    if match:
        print("Found parent container")
        # Replace h2b with something that doesn't limit height or add min-height
        # In pdf2htmlEX, h2b is defined in CSS as a fixed height.
        # We can add inline style height: auto !important;
        replacement = match.group(1) + ' style="height: auto !important; min-height: 20px;" '
        c = c.replace(match.group(1), replacement)

    # 2. Matches the inner 't' div
    # Inner snippet: ... class="t m0 x10 h9 y8c ...
    pattern_inner = r'(<div[^>]*class="[^"]*t\s+m0\s+x10\s+h9\s+y8c[^"]*")'
    match_inner = re.search(pattern_inner, c)
    if match_inner:
        print("Found inner container")
        # Add relative positioning to let it grow
        replacement_inner = match_inner.group(1) + ' style="position: relative !important; height: auto !important; top: 0 !important;" '
        c = c.replace(match_inner.group(1), replacement_inner)
    
    return c

new_content = fix_table_expansion(content)
with open('web-app/src/constants/template.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
