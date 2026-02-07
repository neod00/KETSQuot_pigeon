
import re
path = r'd:\OneDrive\Business\ai automation\LRQA_AutoQuot\KETSQuot\web-app\src\constants\template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def find_context(placeholder):
    idx = content.find(placeholder)
    if idx != -1:
        # Get start/end of tags
        start = content.rfind('<div', 0, idx)
        end = content.find('</div>', idx) + 6
        return content[start:end]
    return "Not found"

with open('template_fragments.txt', 'w', encoding='utf-8') as out:
    out.write("Company Name Context:\n")
    out.write(find_context('{{ company_name }}') + "\n\n")
    out.write("Service Description Context:\n")
    out.write(find_context('{{ service_description }}') + "\n\n")
    out.write("Address Context:\n")
    out.write(find_context('{{ hq_address }}') + "\n\n")
