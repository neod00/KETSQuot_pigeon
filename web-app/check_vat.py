from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# pf4에서 VAT 주변 raw 텍스트 확인
pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')

if pf4_start > 0 and pf5_start > 0:
    pf4_content = content[pf4_start:pf5_start]
    
    # VAT 이후 원본 HTML 확인
    vat_idx = pf4_content.find('VAT')
    if vat_idx > 0:
        raw_after_vat = pf4_content[vat_idx:vat_idx+500]
        print('=== Raw HTML after VAT ===')
        print(raw_after_vat)
        
        # {vat_type 패턴 찾기 (닫는 괄호 없이)
        if '{vat_type' in raw_after_vat:
            idx = raw_after_vat.find('{vat_type')
            print(f'\n{"{vat_type"} found at {idx}')
            print(f'Next 100 chars: {repr(raw_after_vat[idx:idx+100])}')
