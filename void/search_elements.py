import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def find_context(keyword, content, window=200):
    idx = content.find(keyword)
    if idx == -1: return f"NOT FOUND: {keyword}"
    return content[max(0, idx-window):idx+len(keyword)+window]

print("--- assurance_level ---")
print(find_context('{{ assurance_level }}', content))

print("\n--- final_cost ---")
print(find_context('{{ final_cost }}', content))

print("\n--- target_sites / 본사 및 대상 사업장 ---")
# '본사 및 대상 사업장' might be fragmented or replaced.
# Let's search for '검증 받을 조직' context which is the label next to it.
print(find_context('검증', content))

print("\n--- Page 17 COMPANY NAME placeholder ---")
# On page 17, it should be '회사명' or a placeholder.
# Let's find '대표하여 권한이 부여된' context.
print(find_context('대표하여', content))
