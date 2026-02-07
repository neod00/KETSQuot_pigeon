from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# stage1_days 주변 텍스트 찾기
search_terms = ['stage1_days', 'stage2_days', 'stage3_days', 'total_days', 'vat_type']

for term in search_terms:
    placeholder = '{' + term + '}'
    idx = content.find(placeholder)
    if idx > 0:
        # 주변 500자 확인
        context = content[idx:idx+500]
        print(f'=== {placeholder} ===')
        # HTML 태그 사이의 텍스트 추출
        # div 단위로 분리
        divs = re.findall(r'<div[^>]*>([^<]*)</div>', context)
        for i, d in enumerate(divs[:5]):
            d_clean = d.strip()
            if d_clean:
                print(f'  div {i}: "{d_clean}"')
        print()
