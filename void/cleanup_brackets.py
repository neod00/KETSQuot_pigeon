
import re
path = r'd:\OneDrive\Business\ai automation\LRQA_AutoQuot\KETSQuot\web-app\src\constants\template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Company Name brackets on Page 1
# Original: ...he y14 ff3 fs6 fc0 sc0 ls0">[<span class="ff4 ls8 ws1">{{ company_name }}</span><span class="ls7 ws8"></span></div>
content = content.replace('ff6 fc0 sc0 ls0">[<span class="ff4 ls8 ws1">{{ company_name }}</span>', 'ff6 fc0 sc0 ls0"><span class="ff4 ls8 ws1">{{ company_name }}</span>')
# Wait, let's be more robust. I'll just look for bracket+span or span+bracket
content = content.replace('[<span class="ff4 ls8 ws1">{{ company_name }}</span>', '<span class="ff4 ls8 ws1">{{ company_name }}</span>')

# 2. HQ address brackets
# Original: ...fsd fc0 sc0 ls7 ws15">[<span class="ff4 ws14">{{ hq_address }}</span><span class="ls32 ws8"> <span class="ff4 ls8 ws16"></span></span>]
content = content.replace('ws15">[<span class="ff4 ws14">{{ hq_address }}</span>', 'ws15"><span class="ff4 ws14">{{ hq_address }}</span>')
content = content.replace('</span></span>]</span><span class="ff2 ws8">', '</span></span></span><span class="ff2 ws8">')

# 3. Target sites brackets
# Let's find target_sites context
idx = content.find('{{ target_sites }}')
if idx != -1:
    ctx = content[idx-50:idx+100]
    print(f"Target sites context: {ctx}")

# Actually, I'll just do a global replace for the bracket fragments I saw
content = content.replace('[<span class="ff4 ws14">{{ target_sites }}</span>', '<span class="ff4 ws14">{{ target_sites }}</span>')

# Fix other brackets for address/sites
content = content.replace('{{ hq_address }}</span><span class="ls32 ws8"> <span class="ff4 ls8 ws16"></span></span>]', '{{ hq_address }}</span><span class="ls32 ws8"> <span class="ff4 ls8 ws16"></span></span>')
content = content.replace('{{ target_sites }}</span><span class="ls32 ws8"> <span class="ff4 ls8 ws16"></span></span>]', '{{ target_sites }}</span><span class="ls32 ws8"> <span class="ff4 ls8 ws16"></span></span>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated template.ts")
