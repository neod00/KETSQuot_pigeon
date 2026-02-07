from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# 찾고자 하는 키워드들 (전체 일치가 아닌 부분 일치로 검색하여 파편화된 태그 확인)
keywords = [
    'lrqa_contact_name', 
    'hq_address', 
    'ghg_declaration_period', 
    'company_name'
]

print(f"Analyzing {html_path} for broken placeholders...")

for key in keywords:
    # 1. 완벽한 매칭 시도
    perfect_match = content.count(f'{{{key}}}')
    print(f"\nKeyword: {{{key}}}")
    print(f"  - Perfect matches found: {perfect_match}")
    
    # 2. 깨진 패턴 찾기 (간단히 글자 사이사이에 태그가 껴있는지 확인)
    # 예: l.*?r.*?q... 정규식 생성
    broken_regex = r'\{' + r'.*?'.join(list(key)) + r'.*?\}'
    
    matches = list(re.finditer(broken_regex, content, re.DOTALL))
    if matches:
        print(f"  - Potential broken matches found: {len(matches)}")
        for i, m in enumerate(matches):
            raw_text = m.group(0)
            # 너무 길면 오탐지일 수 있으므로 200자 이내만 출력
            if len(raw_text) < 300:
                print(f"    Match #{i+1}: {repr(raw_text)}")
            else:
                print(f"    Match #{i+1}: (Too long, likely false positive)")
    else:
        print("  - No broken matches found (might be completely different text)")

# 3. 문서 끝부분의 company_name (8페이지 추정)
# 파일 뒷부분 20%만 검색
usage_len = len(content) // 5
end_content = content[-usage_len:]
matches = list(re.finditer(r'\{.*?company_name.*?\}', end_content, re.DOTALL))
if matches:
    print(f"\nMatches in last 20% of file (Page 8?):")
    for m in matches:
        print(f"  - {repr(m.group(0))}")
else:
    # 혹시 company_name만 따로 있는게 아니라 그냥 텍스트일 수도 있음
    print("\nNo {company_name} found in last 20%. Checking for 'company' text...")
    idx = end_content.find('company')
    if idx != -1:
         print(f"  - Found 'company' at offset {idx}: {repr(end_content[idx-50:idx+50])}")
