from pathlib import Path

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# stage1_days 주변 원본 HTML 확인
idx = content.find('{stage1_days}')
if idx > 0:
    raw = content[idx:idx+500]
    with open('debug_stage1.txt', 'w', encoding='utf-8') as f:
        f.write(raw)
    print('Saved to debug_stage1.txt')

# total_days 주변 
idx = content.find('{total_days}')
if idx > 0:
    raw = content[idx:idx+500]
    with open('debug_total.txt', 'w', encoding='utf-8') as f:
        f.write(raw)
    print('Saved to debug_total.txt')
