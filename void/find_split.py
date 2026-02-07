import re
with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

# '최종' is often split as '최', '종' in pdf2htmlEX
print("--- Searching for split '최', '종' ---")
# Pattern: '최' -> <span...>최</span>...<span>종</span>
# Or just search for '최' and '종' near each other
matches = re.findall(r'최.{1,50}종', html, re.S)
for m in matches:
    print(m)
    print("-" * 50)

print("\n--- Searching for '금액' ---")
matches = re.findall(r'제안.{1,50}금액', html, re.S)
for m in matches:
    print(m)
    print("-" * 50)
