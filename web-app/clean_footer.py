from pathlib import Path
import re

html_path = Path('public/K-ETSemission_template.html')
content = html_path.read_text(encoding='utf-8')

# 파일 끝부분 꼬임 수정
# </html> 뒤에 오는 이상한 내용 제거
end_tag = '</html>'
idx = content.rfind(end_tag)
if idx != -1:
    print("Trimming corrupted data after </html> tag.")
    content = content[:idx+len(end_tag)] # </html>까지만 남김
else:
    print("Warning: </html> not found.")

html_path.write_text(content, encoding='utf-8')
print("File footer cleaned.")
