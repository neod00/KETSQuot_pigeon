from pathlib import Path

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# pf1 페이지 찾기
pf1_start = content.find('id="pf1"')
print(f'pf1 starts at: {pf1_start}')

# pf2 시작점 찾기
pf2_start = content.find('id="pf2"')
print(f'pf2 starts at: {pf2_start}')

# pf1 내용
if pf1_start > 0 and pf2_start > 0:
    pf1_content = content[pf1_start:pf2_start]
    print(f'pf1 length: {len(pf1_content)} chars')
    
    # pf1 내에서 중괄호로 감싼 단어 찾기
    import re
    all_braces = re.findall(r'\{[^}]+\}', pf1_content)
    print(f'\nAll {{...}} patterns in pf1: {len(all_braces)}')
    for b in all_braces[:20]:
        if not b.startswith('{.') and not b.startswith('{position'):  # CSS 제외
            print(f'  {b}')
            
    # "온실가스 명세서 검증" 텍스트 주변 확인
    check_text = '온실가스 명세서 검증'
    if check_text in pf1_content:
        idx = pf1_content.find(check_text)
        print(f'\n"{check_text}" found in pf1')
