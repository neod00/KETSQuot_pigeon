from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')
original_size = len(content)

print(f'Original file size: {original_size} bytes')

# 1. 분리된 {company_name} 패턴 수정
# 패턴: {comp<span class="_ _1"></span>any<span class="_ _1"></span>_name<span class="_ _1"></span>}
broken_company_pattern = r'\{comp<span class="_ _\d+">\s*</span>any<span class="_ _\d+">\s*</span>_name<span class="_ _\d+">\s*</span>\}'
matches = re.findall(broken_company_pattern, content)
print(f'Found {len(matches)} broken company_name patterns')
for m in matches:
    print(f'  Fixing: {m[:50]}...')
content = re.sub(broken_company_pattern, '{company_name}', content)

# 2. 다른 형태의 분리된 company_name도 확인
# 일반적인 패턴: {company<span...>_</span>name} 등
broken_patterns = [
    (r'\{company<[^>]+>[^<]*</span>_name\}', '{company_name}'),
    (r'\{company_<[^>]+>[^<]*</span>name\}', '{company_name}'),
]
for pattern, replacement in broken_patterns:
    if re.search(pattern, content):
        print(f'Fixing pattern: {pattern}')
        content = re.sub(pattern, replacement, content)

# 3. lrqa_contact_name 추가 - 이미지에서 보이는 위치 찾기
# pf1에서 {lrqa_contact_phone} 바로 위에 담당자 이름이 있어야 함
# 먼저 현재 전화번호 위치 확인
phone_pattern = r'\{lrqa_contact_phone\}'
if re.search(phone_pattern, content):
    print('Found {lrqa_contact_phone}')
    
# "권대근" 또는 담당자 이름이 있는 위치에 플레이스홀더 삽입
# 이미지 기반: {lrqa_contact_name} 텍스트가 표시되어야 하는 위치 찾기

# 4. 다른 분리된 플레이스홀더도 확인
# hq_address, ghg_declaration_period 등
broken_hq = r'\{hq<span class="[^"]*">\s*</span>_address\}'
if re.search(broken_hq, content):
    print('Fixing broken hq_address')
    content = re.sub(broken_hq, '{hq_address}', content)

broken_ghg = r'\{ghg<span class="[^"]*">\s*</span>_declaration<span class="[^"]*">\s*</span>_period\}'
if re.search(broken_ghg, content):
    print('Fixing broken ghg_declaration_period')
    content = re.sub(broken_ghg, '{ghg_declaration_period}', content)

# 일반화된 패턴으로 span 태그 제거
# {xxx<span...></span>yyy} 형태를 {xxxyyy}로
def fix_broken_placeholder(match):
    text = match.group(0)
    # span 태그 모두 제거
    fixed = re.sub(r'<span[^>]*>\s*</span>', '', text)
    return fixed

# 중괄호 안에 span 태그가 있는 모든 패턴 수정
broken_general = r'\{[a-zA-Z_]+(?:<span[^>]*>\s*</span>[a-zA-Z_]*)+\}'
content = re.sub(broken_general, fix_broken_placeholder, content)

# 저장
html_path.write_text(content, encoding='utf-8')
new_size = len(content)
print(f'\nNew file size: {new_size} bytes')
print(f'Size difference: {original_size - new_size} bytes removed')

# 수정 후 확인
print('\n=== Verification ===')
placeholders = re.findall(r'\{([a-zA-Z_][a-zA-Z0-9_]*)\}', content)
unique = list(set(placeholders))
unique.sort()
print(f'Placeholders found ({len(unique)}):')
for p in unique:
    count = content.count('{' + p + '}')
    print(f'  {p}: {count}')
