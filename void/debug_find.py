path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def print_around(keyword, content, before=100, after=500):
    idx = content.find(keyword)
    if idx == -1: return f"NOT FOUND: {keyword}"
    return content[max(0, idx-before):idx+len(keyword)+after]

print("--- Page 2: 최종 ---")
print(print_around('최종', content))

print("\n--- Page 15: 보증수준 ---")
print(print_around('보증수준', content))

print("\n--- Page 17: 각각 ---")
print(print_around('각각', content))

print("\n--- Page 3: 검증 ---")
print(print_around('검증', content))
