from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# {vat_type} 바로 앞에 있는 고정 "VAT" 문구 찾기
# 패턴: VAT </div><div class="..."> {vat_type}
pattern = r'VAT\s*</div>(\s*<div[^>]*>)\s*\{vat_type\}'

if re.search(pattern, content):
    print('Found static VAT label before {vat_type}. Removing it to avoid duplication.')
    # VAT를 제거하고 div 구조는 유지
    content = re.sub(pattern, r' </div>\1{vat_type}', content)
else:
    print('Static VAT label not found or already removed.')

# 혹시 다른 곳에 {vat_type}이 또 있는지 확인
print(f'Total {chr(123)}vat_type{chr(125)} occurrences: {content.count("{vat_type}")}')

html_path.write_text(content, encoding='utf-8')
