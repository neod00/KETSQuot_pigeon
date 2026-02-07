import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target tags for spacing fix
tags = ['company_name', 'hq_address', 'proposal_no', 'lrqa_contact_name', 
        'client_representative_name', 'target_sites', 'application_fee_text', 
        'reporting_period_full', 'service_description']

for t in tags:
    # Use regex to find the elements and add style for normal spacing
    regex = r'(<span|div)( [^>]*class="[^"]*(ws[0-9]+|ls[0-9]+)[^"]*")([^>]*>\s*{{\s*' + t + r'\s*}}\s*</(span|div)>)'
    def replace_func(match):
        tag, class_attr, other_attrs, inner = match.groups()
        # Remove the conflicting spacing classes from class_attr
        new_class_attr = re.sub(r'ws\d+|ls\d+', '', class_attr)
        # Add style override
        return f'{tag}{new_class_attr} style="letter-spacing: normal; word-spacing: normal;"{other_attrs}'
    
    content = re.sub(regex, replace_func, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Safe replacement completed via Python")
