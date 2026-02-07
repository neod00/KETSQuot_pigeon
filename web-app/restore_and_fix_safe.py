from pathlib import Path
import re
import shutil

# 파일 경로 설정
origin_path = Path('public/K-ETSemission_template_origin.html')
target_path = Path('public/K-ETSemission_template.html')

print(f"Restoring {target_path} from {origin_path}...")
shutil.copy2(origin_path, target_path)

content = target_path.read_text(encoding='utf-8')
original_len = len(content)

print("Applying fixes safely...")

# 1. 분리된 플레이스홀더 교정 (company_name, vat_type 등)
# ---------------------------------------------------------
# {comp<span>any</span>_name} 같은 형태 수정
patterns_to_fix = [
    (r'\{comp<span[^>]*>\s*</span>any<span[^>]*>\s*</span>_name<span[^>]*>\s*</span>\}', '{company_name}'),
    (r'\{comp.*?any.*?_name.*?\}', '{company_name}'), # 좀 더 일반적인 패턴
    (r'\{vat_type\s*</div>\s*<div[^>]*>\s*\}', '{vat_type}'), # 분리된 vat_type
    (r'\{lrqa_contact_name\}', '{lrqa_contact_name}') # 있는지 확인용 (변경 없음)
]

for pat, repl in patterns_to_fix:
    if re.search(pat, content):
        content = re.sub(pat, repl, content)
        print(f"Fixed broken placeholder: {repl}")

# 2. Days 텍스트 제거 (1.0 days 한 줄 표시를 위해)
# ---------------------------------------------------------
# {stageX_days} </div><div...>days </div> 형태에서 'days'가 포함된 div 전체 삭제
# 주의: 단순히 텍스트만 지우면 빈 박스가 남아 레이아웃이 깨지므로 div 제거가 핵심

# (1) stageX_days 처리
for stage in ['stage1', 'stage2', 'stage3', 'total']:
    placeholder = '{' + stage + '_days}'
    
    # 패턴: 플레이스홀더 뒤에 오는 'days' 또는 'day'가 든 div
    # 예: {stage1_days} </div><div class="...">days </div>
    days_div_pattern = re.escape(placeholder) + r'\s*</div>\s*(<div[^>]*>\s*(?:days|day)\s*</div>)'
    
    def remove_days_div_callback(match):
        print(f"Removing separate 'days' div for {placeholder}")
        return placeholder + " </div>" # 뒤의 div는 삭제하고 앞부분만 남김

    content = re.sub(days_div_pattern, remove_days_div_callback, content)

    # (2) 혹시 같은 div 안에 있는 경우: {stage1_days} days
    inline_days_pattern = re.escape(placeholder) + r'\s*(?:days|day)'
    if re.search(inline_days_pattern, content):
        print(f"Removing inline 'days' text for {placeholder}")
        content = re.sub(inline_days_pattern, placeholder, content)

# 3. VAT 중복 문구 제거
# ---------------------------------------------------------
# VAT {vat_type} -> {vat_type} (코드에서 'VAT 별도'로 주입하므로)
# 패턴: VAT </div><div ...>{vat_type}
vat_label_pattern = r'VAT\s*</div>(\s*<div[^>]*>)\s*\{vat_type\}'
if re.search(vat_label_pattern, content):
    print("Removing static 'VAT' label before {vat_type}")
    content = re.sub(vat_label_pattern, r' </div>\1{vat_type}', content)


# 4. 인쇄 스타일 주입 (빈 div 숨김 & 글자 줄바꿈 방지)
# ---------------------------------------------------------
# 레이아웃을 확실하게 잡기 위해 CSS 보강
print_css = """
<style>
/* 기존 스타일 유지 */
@media print {
    /* 내용 없는 빈 div 숨기기 (유령 박스 제거 효과) */
    div:empty, span:empty { display: none !important; }
    
    /* 동적 데이터 줄바꿈 방지 */
    .dynamic-value {
        white-space: nowrap !important;
        display: inline-block !important;
        overflow: visible !important;
    }
}
</style>
"""

if '</head>' in content:
    content = content.replace('</head>', print_css + '</head>')
else:
    print("Warning: </head> tag not found, appending CSS to end.")
    content += print_css

# 저장
target_path.write_text(content, encoding='utf-8')
print(f"Recovery and fixes complete. Size: {len(content)} bytes (Original: {original_len})")
