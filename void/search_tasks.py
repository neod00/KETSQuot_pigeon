import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def find_context(text, keyword, window=100):
    idx = text.find(keyword)
    if idx == -1: return None
    return text[max(0, idx-window):min(len(text), idx+len(keyword)+window)]

print("--- 최종 제안금액 ---")
print(find_context(content, "최종 제안금액"))

print("\n--- 제한적 보증수준 ---")
print(find_context(content, "제한적 보증수준"))

print("\n--- 본사 및 대상 사업장 ---")
print(find_context(content, "본사 및 대상 사업장"))

# Look for '회사명' specifically near the end which corresponds to p17
print("\n--- 회사명 (Page 17 check) ---")
# Find last few occurrences
matches = [m.start() for m in re.finditer('회사명', content)]
for m in matches[-5:]:
    print(content[m-50:m+50])
