
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We only care about Page 1 (pf1)
pf1_start = content.find('id="pf1"')
pf2_start = content.find('id="pf2"')
page1 = content[pf1_start:pf2_start]

# 1. Company Name
# Pattern based on search_strings output: <span class="ff5 ws17">회사명</span><span class="ws8">] </span>
# and the brackets before it
page1 = re.sub(r'\[</span><span class="ff5 ws17">회사명</span><span class="ws8">\]', 
               '</span><span class="ff5 ws17">{{ company_name }}</span><span class="ws8">', 
               page1)

# 2. Service Description
# "온실가스 배출량 Scope 1,2,3 제3자 검증"
# It's very fragmented. I'll search for the pieces and empty them, 
# and put the variable in the first one.
page1 = page1.replace('온실가스<span class="ff3 ws8"> </span>배출량', '{{ service_description }}')
# Then empty the rest of the string parts
parts = ['S</span><span class="ff3 ls7 ws4">cope 1,2</span><span class="ff3 ws4">,3</span>',
         '제</span><span class="ff3 ls7 ws4">3</span><span class="ff3 ws4">자</span>',
         '검증']
for p in parts:
    page1 = page1.replace(p, '')

# 3. Date
# Original: 일자: 2026 01 12 일
page1 = page1.replace('2026', '{{ proposal_date }}')
# Empty suffix parts
date_parts = ['01</span><span class="ff3 ws4">월</span>', '12</span><span class="ff3 ws4">일</span>']
for p in date_parts:
    page1 = page1.replace(p, '')

# 4. Proposal No
page1 = page1.replace('QR.001/DK/L1500176', '{{ proposal_no }}')

# 5. Contact Name
page1 = page1.replace('Dal Kim', '{{ lrqa_contact_name }}')

# 6. Contact Phone
# Original context: +82-2-3703-<span class="ls5 ws6"></span></span><span ...>7527
# Let's use a regex for the phone number
page1 = re.sub(r'\+82-2-3703-<span class="ls5 ws6"></span></span><span class="ff3 ls7 ws4">7527',
               '{{ lrqa_contact_phone }}',
               page1)

# 7. Contact Email
page1 = page1.replace('dal.kim@lrqa.com', '{{ lrqa_contact_email }}')

new_content = content[:pf1_start] + page1 + content[pf2_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Manually replaced variables in Page 1")
