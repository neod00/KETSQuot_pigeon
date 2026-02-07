import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def find_near(word1, word2, content, window=1000):
    match1 = re.search(re.escape(word1), content)
    if not match1: return f"NOT FOUND: {word1}"
    start = max(0, match1.start() - window)
    end = min(len(content), match1.end() + window)
    sub = content[start:end]
    if word2 in sub:
        return sub
    return f"FOUND {word1} but NOT {word2} within window"

print("--- Final Cost Bold Check ---")
print(find_near('최종', 'final_cost', content))

print("\n--- Page 15 Assurance Level Spacing ---")
print(find_near('보증수준', 'assurance_level', content))

print("\n--- Page 3 Target Sites ---")
print(find_near('검증', '대상', content))

print("\n--- Page 17 Company Name ---")
# '각각' was found before
print(find_near('각각', '회사명', content))
