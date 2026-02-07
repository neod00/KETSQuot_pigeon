
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# --- Page pfa (Page 10) ---
pfa_start = content.find('id="pfa"')
pfa_end = content.find('id="pfb"') # pfa is followed by pfb
page_a = content[pfa_start:pfa_end]

# 1. Date: 2026 01 월 12 일
# <span class="ff2 lsbc ws8"> 2026 01 <span class="_ _3"> </span> </span> 월 <span class="ff2 ws8"> <span class="lsd1 ws40"> 12 <span class="_"> </span> </span> </span> 일
page_a = re.sub(r'<span class="ff2 lsbc ws8">.*?</span>.*?월.*?일',
                '{{ proposal_date_korean_long }}',
                page_a)

# 2. [회사명]
# <span class="ff4 ws14">회사명</span>
page_a = page_a.replace('<span class="ff4 ws14">회사명</span>', '<span class="ff4 ws14">{{ company_name }}</span>')

# 3. [본사 주소]
# [ <span class="ff4 ws14">본사</span> <span class="ls32 ws8"> </span> <span class="ff4 ws14">주소</span> ]
page_a = re.sub(r'\[ <span class="ff4 ws14">본사</span>.*?주소</span> \]',
                '[ {{ hq_address }} ]',
                page_a)

content = content[:pfa_start] + page_a + content[pfa_end:]

# --- Page pf11 (Page 17) ---
pf11_start = content.find('id="pf11"')
page_11 = content[pf11_start:]

# 1. [회사명] in "SIGNED by [회사명]"
# <span class="ff4 ws2">회사명</span>
page_11 = page_11.replace('<span class="ff4 ws2">회사명</span>', '<span class="ff4 ws2">{{ company_name }}</span>')
# Also another one: [ <span class="ff4 ws14">회사명</span> ]
page_11 = page_11.replace('<span class="ff4 ws14">회사명</span>', '<span class="ff4 ws14">{{ company_name }}</span>')

# 2. Customer side signature dates
# 2026 01 <span class="_ _12"> </span> <span class="ff5 ls7 ws17"> 월 </span> <span class="ls7"> <span class="ls161 ws5e"> 12 <span class="_"> </span> </span> <span class="ff5 ws17"> 일 </span> </span>
# There are two dates. One for customer, one for LRQA.
# LRQA side is the second one usually, but let's replace both or identify.
# Looking at page_11_pretty.txt:
# Row 711 (Customer): 2026 01 ...
# Row 739 (LRQA): 2026 01 ...
page_11 = re.sub(r'2026 01 <span class="_ _12"> </span> <span class="ff5 ls7 ws17"> 월 </span> <span class="ls7"> <span class="ls161 ws5e"> 12 <span class="_"> </span> </span> <span class="ff5 ws17"> 일 </span> </span>',
                 '{{ proposal_date_korean_long }}',
                 page_11)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content[:pf11_start] + page_11)

print("Applied variables to Page 10 and 17.")
