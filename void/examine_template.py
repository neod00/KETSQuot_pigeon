
path = r'd:\OneDrive\Business\ai automation\LRQA_AutoQuot\KETSQuot\web-app\src\constants\template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
    idx = content.find('{{ company_name }}')
    if idx != -1:
        print("Context for {{ company_name }}:")
        print(content[max(0, idx - 200):idx + 200])
    else:
        print("{{ company_name }} not found")

    idx2 = content.find('{{ service_description }}')
    if idx2 != -1:
        print("\nContext for {{ service_description }}:")
        print(content[max(0, idx2 - 200):idx2 + 200])
