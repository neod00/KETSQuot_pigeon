from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# 페이지 구분자 찾기 (pdf2htmlEX는 페이지마다 id="page-container-X" 등을 사용하지 않음, 대신 pfX 사용)
# <div id="pf4" ...> ... </div>
# <div id="pf8" ...> ... </div>

# 4페이지 (pf4) 내용 분석
pf4_match = re.search(r'(<div id="pf4"[^>]*>.*?)(<div id="pf5"|<div class="pi")', content, re.DOTALL)
if pf4_match:
    pf4_content = pf4_match.group(1)
    print("--- Page 4 Content Sample ---")
    # 텍스트가 들어있는 div들만 추출 (좌표 y값 포함)
    divs = re.findall(r'<div class="t [^>]*y([0-9a-f]+)[^>]*>(.*?)</div>', pf4_content)
    # y좌표 순으로 정렬 (16진수)
    divs.sort(key=lambda x: int(x[0], 16))
    
    # 상위 20개, 하위 20개 출력
    print("Top 20 items:")
    for y, text in divs[:20]:
        print(f"y={y}: {text}")
        
    print("\nBottom 20 items:")
    for y, text in divs[-20:]:
        print(f"y={y}: {text}")

# 8페이지 (pf8) 내용 분석 (마지막 페이지일 수 있음)
# pf8부터 파일 끝까지
pf8_match = re.search(r'(<div id="pf8"[^>]*>.*?)(<div id="pf9"|<div class="pi"|</body>)', content, re.DOTALL)
if pf8_match:
    pf8_content = pf8_match.group(1)
    print("\n--- Page 8 Content Sample ---")
    divs = re.findall(r'<div class="t [^>]*y([0-9a-f]+)[^>]*>(.*?)</div>', pf8_content)
    divs.sort(key=lambda x: int(x[0], 16))
    
    print("Top 20 items:")
    for y, text in divs[:20]:
        print(f"y={y}: {text}")

    print("\nBottom 20 items:")
    for y, text in divs[-20:]:
        print(f"y={y}: {text}")
