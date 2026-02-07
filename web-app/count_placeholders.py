from pathlib import Path

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

placeholders = [
    'company_name',
    'target_sites',
    'lrqa_contact_name',
    'hq_address',
    'ghg_declaration_period',
    'stage1_days',
    'total_days',
    'vat_type'
]

print("=== Placeholder Count in HTML ===")
for key in placeholders:
    exact = '{' + key + '}'
    count = content.count(exact)
    print(f"{exact}: {count}")
