import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# --- 1. Fix Page 10 (HQ Address) ---
# Goal: Ensure {{ hq_address }} is visibly placed on Page 10 (pfa).
# First, remove any previous botched attempt.
# We look for the specific style string I used: "bottom: 688.5px; left: 110px;"
content = re.sub(r'<div[^>]*style="bottom: 688\.5px; left: 110px;[^"]*">.*?</div>', '', content, flags=re.DOTALL)
content = re.sub(r'<div[^>]*style="bottom: 688\.5px; left: 110px;[^"]*">', '', content) # In case it was unclosed

# Now find the "본사" label on pfa again.
# We know it's around 1.7MB.
# Regex to find: <div ...>...본사...</div></div>
# We want to append AFTER this div.
pfa_match = re.search(r'id="pfa"', content)
if pfa_match:
    start_pfa = pfa_match.start()
    # Search for "본사" after pfa start
    bonsa_match = re.search(r'(<div[^>]*>[^<]*본사[^<]*</div></div>)', content[start_pfa:])
    if bonsa_match:
        full_match = bonsa_match.group(0)
        global_start = start_pfa + bonsa_match.start()
        global_end = start_pfa + bonsa_match.end()
        
        print(f"Found '본사' at {global_start}. Appending placeholder absolute div.")
        
        # New correct element
        # Moved a bit down? "bottom: 688.5px" was user approved before.
        # Added z-index and explicit font styling.
        new_hq_element = '<div class="t m0 x1 h10" style="bottom: 688.5px; left: 110px; width: 450px; white-space: pre-wrap; font-family: sans-serif; font-size: 14px; color: #000; line-height: 1.2; position: absolute; z-index: 100;">{{ hq_address }}</div>'
        
        # Insert
        content = content[:global_end] + new_hq_element + content[global_end:]
    else:
        print("Error: Could not find '본사' label in pfa!")
else:
    print("Error: Could not find pfa!")


# --- 2. Fix Page 4 (Bold) ---
# Strategy: Find {{ total_days }} (or {{ final_cost }} if total_days absent).
# Get its Y-coordinate class (e.g., y123).
# Bold ALL elements on that same Y-coordinate on that page.
target_ph = '{{ final_cost }}'
if target_ph not in content:
    target_ph = '{{ total_days }}'

ph_match = re.search(re.escape(target_ph), content)
if ph_match:
    print(f"Found {target_ph} at {ph_match.start()}")
    # Find the containing div to get styling and Y class
    # Scan backwards for <div class="c ... y... ..."> or inner div?
    # Usually: <div class="c ... yA ..."><div class="...">...text...</div></div>
    # The Y is on the OUTER div (class="c ...") usually.
    
    # Let's find the closing of the outer div is likely after the match.
    # We search backwards for '<div class="c '
    outer_div_start = content.rfind('<div class="c ', 0, ph_match.start())
    if outer_div_start != -1:
        outer_div_tag = content[outer_div_start:content.find('>', outer_div_start)+1]
        print(f"Container tag: {outer_div_tag}")
        
        # Extract 'y' class
        y_class_match = re.search(r' (y[0-9a-f]+) ', outer_div_tag)
        if y_class_match:
            y_class = y_class_match.group(1)
            print(f"Target Y Class: {y_class}")
            
            # Now, for THIS PAGE (we need to limit scope to the current page), bold everything with this Y class.
            # Find page limits
            page_start = content.rfind('<div class="pf', 0, outer_div_start)
            page_end = content.find('<div class="pf', outer_div_start)
            if page_end == -1: page_end = len(content)
            
            page_content = content[page_start:page_end]
            
            # Regex to replace style of inner divs for this Y class
            # Pattern: <div class="c ... yClass ..."><div ... style="...">CONTENT</div></div>
            # We want to append "font-weight: 700 !important;" to the style.
            
            # It's safer to iterate.
            def bold_replacer(m):
                # m.group(0) is the whole match
                # check if it already has bold
                if 'font-weight: 700' in m.group(0):
                    return m.group(0)
                # Apply bold to the INNER div style
                return re.sub(r'style="([^"]*)"', r'style="\1 font-weight: 700 !important;"', m.group(0))

            # Regex for that specific Y class components
            # <div class="c ... yClass ...">...</div></div>
            # Note: content inside might contain nested divs.
            pattern = r'<div class="c [^"]*?' + y_class + r'[^"]*?">.*?</div></div>'
            
            new_page_content, n = re.subn(pattern, bold_replacer, page_content, flags=re.DOTALL)
            print(f"Applied bold to {n} elements on the page (Row {y_class}).")
            
            content = content[:page_start] + new_page_content + content[page_end:]
            
        else:
            print("Could not determine Y class.")
    else:
        print("Could not find outer div.")
else:
    print(f"Could not find {target_ph}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
