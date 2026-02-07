from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')
original_size = len(content)

print(f'Original file size: {original_size} bytes')

# 더 일반적인 패턴으로 모든 days/day 제거
# 패턴: >days </div> 또는 >days</div> 또는 >day </div> 또는 >day</div>
# stage_days 또는 total_days 바로 다음에 오는 것만

# 1. {XXX_days} </div><div...>days </div> -> {XXX_days} </div><div...> </div>
pattern1 = r'(\{(?:stage[123]|total)_days\} </div><div[^>]*>)days( </div>)'
content = re.sub(pattern1, r'\1\2', content)
print('Pattern 1 applied')

# 2. {XXX_days}</div><div...>days</div> (공백 없는 버전)
pattern2 = r'(\{(?:stage[123]|total)_days\}</div><div[^>]*>)days(</div>)'
content = re.sub(pattern2, r'\1\2', content)
print('Pattern 2 applied')

# 3. day (단수)
pattern3 = r'(\{(?:stage[123]|total)_days\} </div><div[^>]*>)day( </div>)'
content = re.sub(pattern3, r'\1\2', content)
print('Pattern 3 applied')

# 4. 최종 제안금액 행의 days - 다른 위치에 있을 수 있음
# 두 번째 total_days 근처
idx = content.find('{total_days}')
if idx > 0:
    # 두 번째 찾기
    idx2 = content.find('{total_days}', idx + 1)
    if idx2 > 0:
        # 그 주변 확인
        context = content[idx2:idx2+200]
        print(f'\nSecond total_days context (cleaned):')
        clean = re.sub(r'<[^>]+>', ' ', context)
        print(clean[:150])
        
        # days 제거
        if 'days' in context[:50]:
            print('  Fixing days in second total_days...')
            # 정확한 위치 찾아서 교체
            before = content[:idx2]
            after = content[idx2:]
            after = re.sub(r'^(\{total_days\} </div><div[^>]*>)days( </div>)', r'\1\2', after, count=1)
            content = before + after

# 저장
html_path.write_text(content, encoding='utf-8')
new_size = len(content)
print(f'\nNew file size: {new_size} bytes')
print(f'Removed: {original_size - new_size} bytes')
