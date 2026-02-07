import re
with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

def find_fragmented(tokens, content, window=1000):
    # Search for tokens appearing in order within window
    pattern = ".*?".join([re.escape(t) for t in tokens])
    matches = list(re.finditer(pattern, content, re.S))
    return matches

print("--- P2: 최종 제안금액 ---")
# '최', '종', '제', '안', '금', '액' might be in different spans
for m in find_fragmented(['최종', '제안금액'], html):
    print(html[m.start()-50:m.end()+1000])
    print("-" * 50)

print("\n--- P2: final_cost ---")
for m in find_fragmented(['final_cost'], html):
    print(html[m.start()-100:m.end()+100])
    print("-" * 50)
