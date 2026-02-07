import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Snippet shows the styles are applied but maybe the inner div is still causing issues.
# Snippet: ... class="c xf y8d w11"><div style="letter-spacing: ... class="t m0 x10 h9 y8c ... {{ target_sites }} ...

def update_p3_final(c):
    # 1. Clean up potential multiple style applications
    # The snippet shows multiple style tags might be getting tangled.
    
    # Let's find the exact block and replace it with a clean version.
    # The container is <div ... class="c xf y8d w11">
    
    # We will use a regex that captures the whole thing more cleanly.
    pattern = r'<div[^>]*class="[^"]*c\s+xf\s+y8d\s+w11[^"]*".*?{{ target_sites }}.*?</div>\s*</div>'
    match = re.search(pattern, c, re.S)
    if match:
        print("Found the target block")
        # Replace with a version that has NO fixed height and white background.
        # We also add a bottom padding to ensure it covers the line.
        clean_block = (
            '<div style="background: white !important; z-index: 99 !important; '
            'height: auto !important; min-height: 25px !important; overflow: visible !important; '
            'position: absolute !important; display: block !important; padding-bottom: 5px !important;" '
            'class="c xf y8d w11">'
            '<div style="position: relative !important; height: auto !important; top: 0 !important; '
            'display: block !important; letter-spacing: normal !important; word-spacing: normal !important;" '
            'class="t m0 x10 ff5 fs1 fc0 sc0 ls7">'
            '{{ target_sites }}'
            '</div></div>'
        )
        c = c.replace(match.group(0), clean_block)
    return c

new_content = update_p3_final(content)
with open('web-app/src/constants/template.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
