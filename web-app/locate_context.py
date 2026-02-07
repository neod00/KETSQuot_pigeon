from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

print("--- Context-Based Fix Initialized ---")

# 1. 4페이지 {target_sites} 찾기
# '대상 사업장' 또는 'Target Sites' 텍스트를 찾음
# 그 뒤에 오는 div 내용을 {target_sites}로 변경
# (단, 1페이지에도 대상 사업장이 있을 수 있으니 주의. 4페이지는 파일 중간 이후일 것)

# 파일 중간 부분(30%~60%)만 검색
mid_start = int(len(content) * 0.3)
mid_end = int(len(content) * 0.6)
mid_chunk = content[mid_start:mid_end]

# '대상 사업장' 검색 (유니코드 한글일 수 있음)
# '대상' -> '업장' 사이의 거리가 멀 수 있음
# \u5927(\uac00) ... 
# 그냥 'target'이 안 나왔으니 'sites'나 'business' 등으로 찾아봄
# 또는 4페이지의 특유의 문구 "대상 사업장의 범위" 등을 찾음

# 'sites' 주변 검색
match_sites = re.search(r'sites', mid_chunk, re.IGNORECASE)
if match_sites:
    print(f"Found 'sites' at relative offset {match_sites.start()}. Context: {mid_chunk[match_sites.start()-50:match_sites.end()+100]}")
    # 주변에 빈 div나 특정 텍스트가 있으면 target_sites 후보
    # 예: ... Sites ... </div> ... <div ...> {target_sites} </div>
    
    # 4페이지 하단 표 안의 '대상 사업장' 라벨 옆칸 공략
    # 라벨: <div ...>대상 사업장</div>
    # 값: <div ...>{target_sites}</div>
    
    # 임시: 'sites' 뒤에 오는 첫 번째 괄호 {} 가 있는 div를 찾아서 교체
    # 만약 {}가 없다면, 빈 div를 찾아서 넣어야 함.
    
# 2. 8페이지 {company_name} 찾기 (서명란)
# '신청인' 또는 'Name' 또는 'Signature'
end_chunk = content[-int(len(content)*0.2):]

# '신청인' 검색
# '신' ... '청' ... '인'
match_sign = re.search(r'신\s*청\s*인', end_chunk)
if match_sign:
    print(f"Found '신청인' at end. Context: {end_chunk[match_sign.start():match_sign.end()+200]}")
    # 신청인 : (주)ABC ... 서명
    # 여기서 (주)ABC 부분을 {company_name}으로 바꿔야 함
    
# '대표이사' 검색
match_ceo = re.search(r'대\s*표\s*이\s*사', end_chunk)
if match_ceo:
    print(f"Found '대표이사' at end. Context: {end_chunk[match_ceo.start():match_ceo.end()+200]}")


# 실제 수정 로직 (패턴이 확인되면 아래 주석 해제하여 실행)
# content = content.replace(..., ...) 
# html_path.write_text(content, encoding='utf-8')
