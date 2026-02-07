from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# 두 번째 total_days 주변 raw HTML
idx = content.find('{total_days}')
if idx > 0:
    idx2 = content.find('{total_days}', idx + 1)
    if idx2 > 0:
        raw = content[idx2-50:idx2+300]
        with open('debug_total2.txt', 'w', encoding='utf-8') as f:
            f.write(raw)
        print('Saved to debug_total2.txt')
        
        # 앞쪽도 확인 - days가 이전에 있을 수 있음
        raw_before = content[idx2-150:idx2+50]
        with open('debug_total2_before.txt', 'w', encoding='utf-8') as f:
            f.write(raw_before)
        print('Saved to debug_total2_before.txt')
