import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix service_description
old = '<div class="t m0 x0 hf y16 ff4 fs1 fc0 sc0 ls7 ws2">{{ service_description }}</div>'
new = '<div class="t m0 x0 hf y16 ff4 fs1 fc0 sc0 ls7" style="letter-spacing: normal; word-spacing: normal;">{{ service_description }}</div>'
content = content.replace(old, new)

# Fix others if found
tags = ['company_name', 'hq_address', 'proposal_no', 'lrqa_contact_name', 
        'client_representative_name', 'target_sites', 'application_fee_text', 
        'reporting_period_full']

for t in tags:
    # Look for tags with spacing classes
    regex = r'(<(span|div) [^>]*class="[^"]*)(ws[0-9]+|ls[0-9]+)([^"]*"[^>]*>\s*{{\s*' + t + r'\s*}}\s*</(?:span|div)>)'
    content = re.sub(regex, r'\1\4', content) # Remove wsX/lsX from class string
    # Add style override if not already there
    regex_add_style = r'(<(?:span|div) )(class="[^"]*">\s*{{\s*' + t + r'\s*}}\s*</(?:span|div)>)'
    content = re.sub(regex_add_style, r'\1 style="letter-spacing: normal; word-spacing: normal;" \2', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished safe fixes")
