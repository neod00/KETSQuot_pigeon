from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

def hex_dump(s):
    return ' '.join(f'{ord(c):04x}' for c in s)

print(f"Analyzing {html_path}...")

keywords = ['target_sites', 'company_name']

for key in keywords:
    print(f"\n--- Checking '{key}' ---")
    
    # 1. 완벽한 매칭 찾기
    perfect_matches = list(re.finditer(re.escape('{' + key + '}'), content))
    print(f"Perfect matches ('{{{key}}}'): {len(perfect_matches)}")
    
    # 2. 느슨한 검색 (태그/공백/이상한 문자 무시하고 key 글자 순서대로 나오는지)
    # t.*?a.*?r...
    loose_pattern = r'\{' + r'.*?'.join(list(key)) + r'.*?\}'
    loose_matches = list(re.finditer(loose_pattern, content, re.DOTALL))
    
    print(f"Loose matches (fragmented): {len(loose_matches)}")
    
    for i, m in enumerate(loose_matches):
        raw_text = m.group(0)
        is_perfect = (raw_text == '{' + key + '}')
        
        # 완벽하지 않은 것만 분석 (완벽한 건 이미 고쳐진 것)
        if is_perfect:
            continue
            
        print(f"\n[Match #{i+1} - BROKEN]")
        print(f"Raw: {repr(raw_text)}")
        print(f"Hex: {hex_dump(raw_text)}")
        
        # HTML 태그 제거 후 순수 텍스트만 추출해봄
        clean_text = re.sub(r'<[^>]+>', '', raw_text)
        print(f"Cleaned Text: {repr(clean_text)}")
        
        if clean_text != '{' + key + '}':
            print("Warning: Contains extra invisible characters or text inside!")

# 3. 4페이지와 8페이지 특정 영역 집중 공략
# target_sites가 있어야 할 4페이지 구간(파일의 30~60%)에서 'sites' 검색
mid_chunk = content[int(len(content)*0.3):int(len(content)*0.6)]
if 'sites' in mid_chunk.lower():
    idx = mid_chunk.lower().find('sites')
    context = mid_chunk[max(0, idx-50):min(len(mid_chunk), idx+50)]
    print(f"\n--- Page 4 Context Check ('sites') ---")
    print(f"Around 'sites': {repr(context)}")

# company_name이 있어야 할 8페이지 구간(파일 끝 20%)에서 'name' 검색
end_chunk = content[int(len(content)*0.8):]
if 'name' in end_chunk.lower():
    # 여러 개일 수 있음
    print(f"\n--- Page 8 Context Check ('name') ---")
    for m in re.finditer(r'name', end_chunk, re.IGNORECASE):
        ctx = end_chunk[max(0, m.start()-50):min(len(end_chunk), m.end()+50)]
        print(f"Around 'name': {repr(ctx)}")
