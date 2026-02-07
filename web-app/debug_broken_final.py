from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# 1. 8페이지 {company_name} 주변 추출
# 파일 끝부분 20%에서 'company' 또는 'name'이 포함된 줄 찾기
end_chunk = content[-len(content)//5:]
# 'company' 주변 300자 추출
matches = list(re.finditer(r'.{0,100}company.{0,100}', end_chunk, re.DOTALL | re.IGNORECASE))
print(f"--- 8페이지 후보군 (company) ---")
for i, m in enumerate(matches):
    print(f"#{i+1}: {repr(m.group(0))}\n")

# 2. 4페이지 {target_sites} 주변 추출
# 'target' 이나 'site' 검색
matches_target = list(re.finditer(r'.{0,100}target.{0,100}', content, re.DOTALL | re.IGNORECASE))
print(f"--- 4페이지 후보군 (target) ---")
for i, m in enumerate(matches_target):
    # 너무 앞쪽(1~2페이지)이면 건너뛰기
    if m.start() < len(content) * 0.3:
        continue
    print(f"#{i+1} (offset {m.start()}): {repr(m.group(0))}\n")

# 3. 'site' 검색 (target이 없을 수도 있음)
matches_site = list(re.finditer(r'.{0,100}site.{0,100}', content, re.DOTALL | re.IGNORECASE))
print(f"--- 4페이지 후보군 (site) ---")
for i, m in enumerate(matches_site):
    if m.start() < len(content) * 0.3 or m.start() > len(content) * 0.6:
        continue
    print(f"#{i+1} (offset {m.start()}): {repr(m.group(0))}\n")
