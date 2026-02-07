
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

# 1. Audit Days
page4 = page4.replace('1.0 days', '{{ stage1_days }} days')
page4 = page4.replace('3.0 days', '{{ stage2_days }} days')
page4 = page4.replace('2.0 days', '{{ stage3_days }} days')
# The 합계 and 최종제안금액 might have the same days. We replace them too.
# There are two 6.0 days in the text.
page4 = page4.replace('6.0 days', '{{ total_days }} days')

# 2. Costs
page4 = page4.replace('1,350,000', '{{ stage1_cost }}')
page4 = page4.replace('4,050,000', '{{ stage2_cost }}')

# Stage 3 cost (split)
page4 = re.sub(r'2,700,0<span class="lsa ws1c">00</span>', 
               '{{ stage3_cost }}', 
               page4)

# Expenses
page4 = page4.replace('400,000', '{{ expenses }}')

# Total cost (split)
# I need to find how 8,500,000 is split. 
# Looking at p4_text.txt, it says "8,500,0" then "00".
page4 = re.sub(r'8,500,0<span class="lsa ws1c">00</span>', 
               '{{ total_cost }}', 
               page4)

# Final cost
page4 = page4.replace('8,000,000', '{{ final_cost }}')

# 3. Additonal Notes
# Audit Rate: 1, 350,000
page4 = re.sub(r'<span class="ls4f ws1f">1,</span><span class="ws20">350,000', 
               '<span class="ls4f ws1f"></span><span class="ws20">{{ audit_rate }}', 
               page4)

# Validity
page4 = page4.replace('>90<', '>{{ quote_validity_days }}<')

# Application Fee (신청비)
# We make the whole "면제 (720,000)" part a variable
page4 = re.sub(r'면제<span class="ff2 ls44"> \(<span class="lsa ws1c">720<span class="ls7 ws8">,000\)</span></span></span>',
               '{{ application_fee_text }}',
               page4)

new_content = content[:pf4_start] + page4 + content[pf5_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Finished replacements for Page 4")
