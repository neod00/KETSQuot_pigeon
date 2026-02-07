from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')
original_len = len(content)

print("Starting Smart De-fragmentation...")

def smart_fix(content):
    # '{' 와 '}' 사이의 문자가 300자 이내인 모든 패턴을 찾음 (태그가 많을 수 있으므로 넉넉하게)
    # 괄호 자체가 쪼개져있을 수도 있지만, 보통 내용은 텍스트 노드에 있으므로 내용은 쪼개져도 괄호는 보존되는 경우가 많음
    # 하지만 괄호와 글자 사이에도 태그가 있을 수 있음.
    
    # 전략: 전체 파일에서 '{' ... '}' 패턴을 찾는 정규식은 너무 위험하므로,
    # target_sites와 company_name의 글자들 사이에 "태그 또는 공백"이 들어간 패턴을 생성하여 검색
    
    # 1. target_sites 패턴 생성
    # t + (태그/공백)* + a + (태그/공백)* + ...
    garbage = r'(?:\s*<[^>]+>\s*)*' # 태그와 공백 뭉치
    
    chars = list('target_sites')
    pattern_target = r'\{' + garbage + garbage.join(chars) + garbage + r'\}'
    
    # 2. company_name 패턴 생성
    chars_company = list('company_name')
    pattern_company = r'\{' + garbage + garbage.join(chars_company) + garbage + r'\}'
    
    # 교체 실행
    matches_target = list(re.finditer(pattern_target, content))
    print(f"Found {len(matches_target)} matches for broken {{target_sites}}")
    for m in matches_target:
        print(f"  - Replacing: {m.group(0)[:50]}...")
    content = re.sub(pattern_target, '{target_sites}', content)
    
    matches_company = list(re.finditer(pattern_company, content))
    print(f"Found {len(matches_company)} matches for broken {{company_name}}")
    for m in matches_company:
        print(f"  - Replacing: {m.group(0)[:50]}...")
    content = re.sub(pattern_company, '{company_name}', content)
    
    return content

new_content = smart_fix(content)

# 혹시 괄호 밖으로 글자가 튀어나간 흉악한 케이스 대비 ({target_ ... </div> sites})
# target_sites 라는 글자가 완성되지 않고 중간에 div가 끼어있는 경우 검색
# "target" ... "sites"
if '{target_sites}' not in new_content:
    print("Standard fix failed for {target_sites}. Trying aggressive div spanning search...")
    # target ... sites 사이에 div 태그가 있는 경우
    # 예: target</div><div...>_sites
    pattern_split_div = r'target(?:[^<]*<[^>]+>[^<]*)*_sites'
    matches = list(re.finditer(pattern_split_div, new_content))
    for m in matches:
         # 해당 구간 앞뒤로 { } 가 있는지 확인은 어렵지만, 일단 이 텍스트 뭉치를 찾아서 대체 시도
         # 텍스트가 명확하면 교체
         print(f"  - Found text-only split: {m.group(0)[:50]}...")
         # 보통 이런 경우 앞뒤에 { } 잔해물도 같이 처리해야 함.
         # 여기서는 일단 발견된 텍스트 뭉치를 {target_sites}로 바꿈 (괄호 없이 발견될 수도 있음)
         new_content = new_content.replace(m.group(0), '{target_sites}')

# company_name도 동일하게
pattern_split_company = r'company(?:[^<]*<[^>]+>[^<]*)*_name'
matches = list(re.finditer(pattern_split_company, new_content))
for m in matches:
    # 이미 {company_name}으로 고쳐진 것 제외
    if m.group(0) == 'company_name': continue
    print(f"  - Found text-only split company: {m.group(0)[:50]}...")
    new_content = new_content.replace(m.group(0), '{company_name}')

# 저장
html_path.write_text(new_content, encoding='utf-8')
print(f"Finished. Size: {len(new_content)}")
