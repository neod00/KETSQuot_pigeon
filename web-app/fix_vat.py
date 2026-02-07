from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')
original_size = len(content)

print(f'Original file size: {original_size} bytes')

# {vat_type와 }가 분리된 패턴 찾기
# 패턴: {vat_type</div><div...>} 형태
broken_vat_pattern = r'\{vat_type\s*</div>\s*<div[^>]*>\s*\}'

matches = re.findall(broken_vat_pattern, content)
print(f'Found {len(matches)} broken vat_type patterns')
for m in matches:
    print(f'  {m[:100]}...')

# 수정: {vat_type</div><div...>} -> {vat_type}</div><div...> 
# 더 정확하게: 전체를 {vat_type}로 교체하면 레이아웃이 깨질 수 있으므로
# } 를 {vat_type 뒤로 이동

def fix_broken_vat(match):
    original = match.group(0)
    # {vat_type + 중간 태그들 + } -> {vat_type} + 중간 태그들
    # 중간 div 태그 추출
    middle = re.search(r'</div>\s*(<div[^>]*>)\s*\}', original)
    if middle:
        div_tag = middle.group(1)
        fixed = '{vat_type}</div>' + div_tag
        print(f'  Fixed to: {fixed[:80]}...')
        return fixed
    return original

content = re.sub(broken_vat_pattern, fix_broken_vat, content)

# 저장
html_path.write_text(content, encoding='utf-8')
new_size = len(content)
print(f'\nNew file size: {new_size} bytes')

# 확인
count = content.count('{vat_type}')
print(f'{"{vat_type}"} now found: {count} occurrences')
