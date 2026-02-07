
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf3_start = content.find('id="pf3"')
pf4_start = content.find('id="pf4"')
page3 = content[pf3_start:pf4_start]

# 1. Company Name [회사명]
page3 = re.sub(r'\[</span><span class="ff5 ws17">회사명</span><span class="ws8">\]', 
               '</span><span class="ff5 ws17">{{ company_name }}</span><span class="ws8">', 
               page3)

# 2. HQ Address [본사 주소]
# First occurrence
page3 = re.sub(r'\[</span><span class="ff4 ws14">본사</span><span class="ls32 ws8"><span class="ff4 ls8 ws16">주소</span></span>\]',
               '{{ hq_address }}',
               page3)
# Second occurrence (inside boundary definition)
page3 = re.sub(r'\[</span></span><span class="ls4 ws19">본사</span><span class="ff1 ws8"></span><span class="ls4 ws19">주소</span><span class="ff1 ws8">\]',
               '{{ hq_address }}',
               page3)

# 3. Target Sites [대상 사업장]
page3 = re.sub(r'\[</span><span class="ff5 ws17">대상</span><span class="ws8"><span class="ff5 ws17">사업장</span>\]',
               '{{ target_sites }}',
               page3)

# 4. Verification Year (2025)
# Original: 202<span class="ls34">5<span class="ff5 ls7 ws17">년</span>
page3 = re.sub(r'202<span class="ls34">5<span class="ff5 ls7 ws17">년</span>',
               '{{ verification_year }}년',
               page3)

# 5. Assurance Level
# Original: 제한적<span class="ff1 ls33 ws8"></span>보증수준<span class="ff1 ws8">(Lim<span class="_ _2"></span>ited level of assurance)
# We replace the whole block
page3 = re.sub(r'제한적<span class="ff1 ls33 ws8"></span>보증수준<span class="ff1 ws8">\(Lim<span class="_ _2"></span>ited level of assurance\)',
               '{{ assurance_level }}',
               page3)

# 6. Materiality Level (5%)
page3 = page3.replace('5%', '{{ materiality_level }}')

new_content = content[:pf3_start] + page3 + content[pf4_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Applied replacements for Page 3")
