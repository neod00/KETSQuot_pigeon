
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

# Fix Application Fee (신청비)
# We search for the "면제" text more broadly within its div
# Looking at the structured text: 면제 (720,000)
# Let's find the container div
# <div class="c x16 ya1 w15 h2f"><div class="t m0 x1a h10 ya2 ff5 fs7 fc0 sc0 ls7 ws4">면제<span class="ff2 ls44">(<span class="lsa ws1c">720<span class="ls7 ws8">,000)</span></span></span></div></div>
page4 = re.sub(r'면제<span class="ff2 ls44">\(<span class="lsa ws1c">720<span class="ls7 ws8">,000\)</span></span></span>',
               '{{ application_fee_text }}',
               page4)

# Fix Audit Rate in Notes
# <span class="ls4f ws1f">1,</span><span class="ws20">350,000<span class="_"></span></span>원
page4 = re.sub(r'<span class="ls4f ws1f">1,</span><span class="ws20">350,000',
               '<span class="ls4f ws1f"></span><span class="ws20">{{ audit_rate }}',
               page4)

new_content = content[:pf4_start] + page4 + content[pf5_start:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Applied fixes for Page 4")
