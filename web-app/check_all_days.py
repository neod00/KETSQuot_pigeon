from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# 모든 stage_days와 total_days 주변 확인
for term in ['stage1_days', 'stage2_days', 'stage3_days', 'total_days']:
    placeholder = '{' + term + '}'
    # 모든 발생 위치 찾기
    idx = 0
    occurrences = []
    while True:
        idx = content.find(placeholder, idx)
        if idx == -1:
            break
        context = content[idx:idx+150]
        occurrences.append((idx, context[:100]))
        idx += 1
    
    print(f'=== {placeholder}: {len(occurrences)} occurrences ===')
    for i, (pos, ctx) in enumerate(occurrences):
        # days/day 확인
        has_days = 'days' in ctx or '>day<' in ctx or '>day ' in ctx
        print(f'  #{i+1} at {pos}: has_days={has_days}')
        if has_days:
            # context에서 관련 부분 출력
            clean = re.sub(r'<[^>]+>', '|', ctx)
            print(f'      {clean[:80]}')
