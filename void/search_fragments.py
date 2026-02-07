import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def find_fragmented(content, words, window=200):
    # Search for words occurring somewhat near each other
    pattern = r'.*?'.join([re.escape(w) for w in words])
    for m in re.finditer(pattern, content):
        start = max(0, m.start() - window)
        end = min(len(content), m.end() + window)
        print(f"Found match for {words}:")
        print(content[start:end])
        print("-" * 50)

print("--- Searching for 최종 제안금액 ---")
find_fragmented(content, ["최종", "제안금액"])

print("\n--- Searching for 제한적 보증수준 ---")
find_fragmented(content, ["제한적", "보증수준"])

print("\n--- Searching for 본사 및 대상 사업장 ---")
find_fragmented(content, ["본사", "대상", "사업장"])

print("\n--- Searching for 검증 받을 조직 ---")
find_fragmented(content, ["검증", "받을", "조직"])
