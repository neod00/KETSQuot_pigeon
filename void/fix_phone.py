
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf1_start = content.find('id="pf1"')
pf2_start = content.find('id="pf2"')
page1 = content[pf1_start:pf2_start]

# Fix Phone Number
if '+82-2-3703-' in page1:
    page1 = page1.replace('+82-2-3703-', '{{ lrqa_contact_phone }}')
    # Use regex to find 7527 within the vicinity
    page1 = re.sub(r'{{ lrqa_contact_phone }}<span class="ls5 ws6">7527</span>', '{{ lrqa_contact_phone }}<span class="ls5 ws6"></span>', page1)
    # Also handle the whitespace issue if any
    page1 = page1.replace('7527', '')

new_content = content[:pf1_start] + page1 + content[pf2_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Applied phone number fix")
