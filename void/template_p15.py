
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pff_start = content.find('id="pff"')
# Find the start of the next page to limit scope. Usually pf10 or pf11.
# Based on earlier count_pages.py: pf9, pfa, pfb, pfc, pfd, pfe, pff, pf10, pf11
pf10_start = content.find('id="pf10"')
page_f = content[pff_start:pf10_start]

# 1. Reporting Period
# Original: <div class="t m0 x10 h10 y215 ff5 fs7 fc0 sc0 ls7 ws4"> 보고기간 <span class="ff2 ls28 ws8"> : <span class="ls7 ws3d"> 2025 <span class="_"> </span> </span> </span> 년 ...
# This logic is very fragile due to split text. I will replace the entire line for reporting period.
page_f = re.sub(r'보고기간<span class="ff2 ls28 ws8"> : <span class="ls7 ws3d">2025<span class="_"></span></span></span>년<span class="ff2 ws8">1<span class="_ _3"></span></span><span class="ls4">월</span><span class="ff2 ws8"> ~ 12<span class="_ _3"></span></span>월<span class="ff2 ws8">\(<span class="lsa ws3c">12<span class="_"></span></span></span>개월<span class="ff2 ls44">\)</span>',
                '보고기간 : {{ reporting_period_full }}',
                page_f)

# 2. Assurance Level
# Original text: 제한적 보증수준 (Limited level of assurance)
# HTML fragments: 제한적<span class="ff3 ls2f ws8"></span>보증수준<span class="ff3 ws8">(Lim<span class="_ _2"></span>ited level of assuran<span class="_ _2"></span>ce)</span>
page_f = re.sub(r'제한적<span class="ff3 ls2f ws8"></span>보증수준<span class="ff3 ws8">\(Lim<span class="_ _2"></span>ited level of assuran<span class="_ _2"></span>ce\)</span>',
                '{{ assurance_level }}',
                page_f)

# 3. Materiality Level
# Original: 5%
# HTML: <div class="t m0 x10 hf y219 ff3 fs1 fc0 sc0 ls153 ws57">5%<span class="ls7 ws8"> </span></div>
page_f = page_f.replace('>5%<', '>{{ materiality_level }}<')

# Write back
new_content = content[:pff_start] + page_f + content[pf10_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Applied variables to Page 15 (pf f).")
