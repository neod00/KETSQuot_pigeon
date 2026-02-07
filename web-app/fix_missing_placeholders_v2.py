from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# 1. 1페이지 {lrqa_contact_name}
# 'lrqa'와 'contact' 사이가 멀어져 있거나 태그로 난도질된 경우
# {lrqa_contact_name} 형태를 찾아서 정규화
pattern_contact = r'\{l[^}]*r[^}]*q[^}]*a[^}]*c[^}]*o[^}]*n[^}]*t[^}]*a[^}]*c[^}]*t[^}]*n[^}]*a[^}]*m[^}]*e[^}]*\}'
if re.search(pattern_contact, content):
    content = re.sub(pattern_contact, '{lrqa_contact_name}', content)
    print("Fixed broken {lrqa_contact_name}")
else:
    print("Warning: Could not find broken pattern for {lrqa_contact_name}. Please check the HTML text.")

# 2. 3페이지 {hq_address}
# {hq_address} 가 쪼개진 형태
pattern_address = r'\{h[^}]*q[^}]*a[^}]*d[^}]*d[^}]*r[^}]*e[^}]*s[^}]*s[^}]*\}'
if re.search(pattern_address, content):
    content = re.sub(pattern_address, '{hq_address}', content)
    print("Fixed broken {hq_address}")

# 3. 3,4페이지 {ghg_declaration_period}
# {ghg_declaration_period} 가 쪼개진 형태
# ghg_d..._period
# 너무 기니까 ghg_d... 까지만 매칭해도 될 듯
pattern_ghg = r'\{g[^}]*h[^}]*g[^}]*_[^}]*d[^}]*e[^}]*c[^}]*l[^}]*a[^}]*r[^}]*a[^}]*t[^}]*i[^}]*o[^}]*n[^}]*_[^}]*p[^}]*e[^}]*r[^}]*i[^}]*o[^}]*d[^}]*\}'
if re.search(pattern_ghg, content):
    # 모두 찾아서 교체 (여러 군데 있을 수 있음)
    content = re.sub(pattern_ghg, '{ghg_declaration_period}', content)
    print("Fixed broken {ghg_declaration_period}")

# 4. 8페이지 {company_name}
# 아까 분석에서 '{company_name}'QA... 같은 이상한 패턴이 보였음
# {company_name} 주변에 붙은 잡다한 것들 정리
# {comp...any...name} 을 찾되, 태그가 섞여있는 것을 감안
pattern_company = r'\{c[^}]*o[^}]*m[^}]*p[^}]*a[^}]*n[^}]*y[^}]*_[^}]*n[^}]*a[^}]*m[^}]*e[^}]*\}'
if re.search(pattern_company, content):
    content = re.sub(pattern_company, '{company_name}', content)
    print("Fixed broken remaining {company_name}")

html_path.write_text(content, encoding='utf-8')
