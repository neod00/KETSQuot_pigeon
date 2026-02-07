import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Table Analysis - let's search for {{ client_representative_title }}
print("Searching for p17 variables...")
for v in ["client_representative_title", "client_representative_name"]:
    idx = content.find(f"{{{{ {v} }}}}")
    if idx != -1:
        print(f"Found {v} at {idx}: {content[idx-200:idx+200]}")

# p10 hq_address search
print("Searching for p10 address markers...")
p10_id = content.find('id="pf10"')
if p10_id != -1:
    idx_cust = content.find("고객", p10_id, p10_id + 10000)
    if idx_cust != -1:
        print(f"Found 고객 at {idx_cust}: {content[idx_cust:idx_cust+500]}")

# UI check
with open('web-app/src/app/page.tsx', 'r', encoding='utf-8') as f:
    page_content = f.read()
print("page.tsx formData loop:")
print(page_content[page_content.find('formData'):page_content.find('formData')+2000])

