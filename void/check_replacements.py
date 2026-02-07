
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

variables = [
    '{{ company_name }}',
    '{{ proposal_date }}',
    '{{ proposal_no }}',
    '{{ service_description }}',
    '{{ lrqa_contact_name }}',
    '{{ lrqa_contact_phone }}',
    '{{ lrqa_contact_email }}'
]

for var in variables:
    if var in content:
        print(f"Found {var}")
        idx = content.find(var)
        print(f"Context: {content[max(0, idx-50):min(len(content), idx+100)]}\n")
    else:
        print(f"NOT FOUND: {var}")
