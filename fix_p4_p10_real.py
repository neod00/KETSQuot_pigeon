import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File size: {len(content)}")
print(f"Last 500 chars: {repr(content[-500:])}")

# --- FIX PAGE 10 (HQ Address) ---
# Check if {{ hq_address }} exists
if '{{ hq_address }}' not in content:
    print("'{{ hq_address }}' MISSING. Attempting to restore it.")
    # We need to find "본사 주소:" or similar to know where to put it, or just append it to Page 10 (pfa).
    # But wait, looking at the user's issue, "본사 주소:" is present (in the image). 
    # The placeholder should be absolutely positioned.
    
    # Let's find "본사" on Page 10 (id="pfa")
    # pfa is usually page 10.
    p10_match = re.search(r'id="pfa".*?</div>', content, re.DOTALL) # Finds start of p10
    
    # Better: find the container that has "본사"
    # User image: "(2) 고객: ... 본사주소:"
    # In the file, it might be split.
    # Let's verify if the placeholder was accidentally removed or if my previous append went outside the string.
    
    if '{{ hq_address }}' not in content:
        # If it's completely missing, we need to add it.
        # Ideally, we put it right after the "본사주소" label div.
        # Find "본사"
        match = re.search(r'(<div[^>]*>.*?본사.*?</div></div>)', content, re.DOTALL)
        if match:
             print(f"Found '본사' container: {match.group(0)}")
             # We will append the corrected absolute div AFTER this container.
             # Note: This has to be carefully placed so it's inside the main template string (between backticks).
             
             # The new element I designed before:
             new_hq_element = '<div class="t m0 x1 h10" style="bottom: 688.5px; left: 110px; width: 450px; white-space: pre-wrap; letter-spacing: normal !important; word-spacing: normal !important; line-height: 1.2; position: absolute; z-index: 100;">{{ hq_address }}</div>'
             
             # Insert it after the found container
             replacement = match.group(0) + new_hq_element
             content = content.replace(match.group(0), replacement)
             print("Restored '{{ hq_address }}' placeholder.")
        else:
             print("Could not find '본사' container to append placeholder.")

else:
    print("'{{ hq_address }}' FOUND. Checking why it might not show.")
    # Check context
    pos = content.find('{{ hq_address }}')
    print(f"Context: {content[pos-100:pos+100]}")


# --- FIX PAGE 4 (Bold Text) ---
# "최종 제안금액(특별할인)", "VAT 별도", "6.0 days", "8,500,000" should be bold.
# In regex, spaces might be in tags or distinct.
# Pattern for "최종 제안금액(특별할인)"
# Instead of complex regex, let's find the unique context.
# user image: Yellow highlight.
# Often highlight is a background color or class.
# Let's look for "최종" near "days" near "days" is dubious.
# "6.0 days" -> {{ total_days }} days?
# "8,500,000" -> {{ final_cost }}?

# Let's finding "최종" and its container.
matches = val_matches = list(re.finditer(r'(<div[^>]*>.*?최종.*?제안금액.*?</div></div>)', content, re.DOTALL))
if len(matches) > 0:
    for m in matches:
        print(f"Found '최종 제안금액' container: {m.group(0)}")
        # Check if bold
        if 'font-weight: 700' not in m.group(0) and 'ff4' not in m.group(0): # ff4 usually bold?
             print("Applying bold to '최종 제안금액'")
             # simple style append
             new_div = m.group(0).replace('style="', 'style="font-weight: 700 !important; ')
             content = content.replace(m.group(0), new_div)
else:
    print("Could not find '최종 제안금액' via simple regex. Trying fuzzy.")

# Also "VAT 별도"
matches_vat = list(re.finditer(r'(<div[^>]*>.*?VAT.*?별도.*?</div></div>)', content, re.DOTALL))
if len(matches_vat) > 0:
    for m in matches_vat:
        print(f"Found 'VAT 별도' container: {m.group(0)}")
        if 'font-weight: 700' not in m.group(0):
             print("Applying bold to 'VAT 별도'")
             new_div = m.group(0).replace('style="', 'style="font-weight: 700 !important; ')
             content = content.replace(m.group(0), new_div)

# Also placeholders on that line: {{ total_days }} and {{ final_cost }}
# We should look for placeholders near "days" or generally if they are in that row.
# But let's look for {{ final_cost }} directly.
if '{{ final_cost }}' in content:
    # Make it bold
    content = re.sub(r'(<div[^>]*style=")([^"]*)(".*?>\s*\{\{ final_cost \}\}\s*</div></div>)', 
                     lambda m: m.group(1) + (m.group(2) + ' font-weight: 700 !important;' if 'font-weight: 700' not in m.group(2) else m.group(2)) + m.group(3), 
                     content)
    print("Applied bold to {{ final_cost }}")

# {{ total_days }}
if '{{ total_days }}' in content:
    # Make it bold
    content = re.sub(r'(<div[^>]*style=")([^"]*)(".*?>.*?\{\{ total_days \}\}.*?</div></div>)', 
                     lambda m: m.group(1) + (m.group(2) + ' font-weight: 700 !important;' if 'font-weight: 700' not in m.group(2) else m.group(2)) + m.group(3), 
                     content)
    print("Applied bold to {{ total_days }}")


# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
