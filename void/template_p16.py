
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf10_start = content.find('id="pf10"')
pf11_start = content.find('id="pf11"')
page_16 = content[pf10_start:pf11_start]

# 1. Project days in sentence: "5 .0 일이" -> "{{ total_days }} 일이"
# Based on extract_p16: 5<span class="_ _3"></span>.0 일이
page_16 = re.sub(r'5<span class="_ _3"></span>\.0\s*일이', '{{ total_days }} 일이', page_16)

# 2. Table Header: "Year 20 26" -> "Year {{ verification_year }}"
# Based on extract_p16: Year 20<span class="_"></span>26
page_16 = re.sub(r'Year 20<span class="_"></span>26', 'Year {{ verification_year }}', page_16)

# 3. Application Fee: "면제 (720,000 원 )" -> "{{ application_fee_text }}"
# Based on extract_p16 segments: 면제 / (720,000 / 원 / )
page_16 = re.sub(r'면제<span class="ff2 ws8">\(720,000<span class="_"></span>원<span class="ff2 ws8">\)</span></span>', 
                 '{{ application_fee_text }}', page_16)

# 4. Table Audit Days: "6.0 day s" -> "{{ total_days }} days"
# Based on extract_p16: 6.0 day<span class="_"></span>s
page_16 = re.sub(r'6\.0\s*day<span class="_"></span>s', '{{ total_days }} days', page_16)

# 5. Table Audit Cost: "8, 000 ,000 원" -> "{{ final_cost }} 원"
# Based on extract_p16: 8,<span class="_"></span>000<span class="_"></span>,000 원
page_16 = re.sub(r'8,<span class="_"></span>000<span class="_"></span>,000\s*원', '{{ final_cost }} 원', page_16)

# 6. Sum (Same as final cost)
# There's another 8,000,000 later in the Sum row
page_16 = re.sub(r'8,<span class="_"></span>000<span class="_"></span>,000\s*원', '{{ final_cost }} 원', page_16)

# 7. Expenses: Keep "상기 포함" (It's already there)
# Based on extract_p16: 상기<span class="ff2 ws8"></span>포함

# Write back
new_content = content[:pf10_start] + page_16 + content[pf11_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Applied variables to Page 16 (pf 10).")
