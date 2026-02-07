
import sys

file_path = 'LRQA_GHGP_contract.html'
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='cp949') as f:
        content = f.read()

# Define the start and end of page 1 to limit replacements
pf1_start = content.find('id="pf1"')
pf2_start = content.find('id="pf2"')

if pf1_start == -1 or pf2_start == -1:
    print("Could not find pf1 or pf2")
    sys.exit(1)

page1 = content[pf1_start:pf2_start]

# Replacements mapping
# We use the text extracted from BeautifulSoup earlier as guidance
replacements = [
    ('>[<', '><'),
    ('>회사명<', '>{{ company_name }}<'),
    ('>]<', '><'),
    ('>온실가스 배출량<', '>{{ service_description }}<'),
    ('>S<', '><'),
    ('>cope 1,2<', '><'),
    ('>,3<', '><'),
    ('>제<', '><'),
    ('>3<', '><'),
    ('>자<', '><'),
    ('>검증<', '><'),
    (': 2026', ': {{ proposal_date }}'),
    ('>01<', '><'),
    ('>월<', '><'),
    ('>12<', '><'),
    ('>일<', '><'),
    ('>QR.001/DK/L1500176<', '>{{ proposal_no }}<'),
    ('>Dal Kim<', '>{{ lrqa_contact_name }}<'),
    ('>+82-2-3703-<', '>{{ lrqa_contact_phone }}<'),
    ('>7527<', '><'),
    ('>dal.kim@lrqa.com<', '>{{ lrqa_contact_email }}<'),
]

new_page1 = page1
for old, new in replacements:
    new_page1 = new_page1.replace(old, new)

new_content = content[:pf1_start] + new_page1 + content[pf2_start:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Finished replacements for Page 1")
