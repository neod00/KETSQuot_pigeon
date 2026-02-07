import re

def remove_brackets_from_text(html):
    # Split by tags to find text chunks
    parts = re.split(r'(<[^>]+>)', html)
    new_parts = []
    in_script = False
    in_style = False
    
    for p in parts:
        if p.startswith('<script'):
            in_script = True
        elif p.startswith('</script'):
            in_script = False
        elif p.startswith('<style'):
            in_style = True
        elif p.startswith('</style'):
            in_style = False
            
        if not p.startswith('<') and not in_script and not in_style:
            # This is text content
            p = p.replace('[', '').replace(']', '')
        elif p.startswith('<') and not in_script and not in_style:
            # This is a tag. Check if it's a data-data attribute which contains JSON with brackets.
            # We should NOT remove brackets from data-data='...' or data-data="{...}"
            # But the requirement is to remove visual brackets.
            # Visual brackets are usually OUTSIDE the tags or split.
            pass
            
        new_parts.append(p)
    return ''.join(new_parts)

with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Also handle cases where brackets are isolated in their own span or tag
# like <span ...>[</span>
html = re.sub(r'<span[^>]*>\s*\[\s*</span>', '', html)
html = re.sub(r'<span[^>]*>\s*\]\s*</span>', '', html)

# Generic text removal
html = remove_brackets_from_text(html)

with open('LRQA_GHGP_contract.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Brackets removed from LRQA_GHGP_contract.html")
