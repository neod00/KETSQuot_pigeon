
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
# Find all occurrences of "회사명", "[회사명]", "본사", "주소" that are NOT yet placeholders
# We only care about those in text nodes.
# But for now, let's just search the string.

search_terms = ['회사명', '본사', '주소', '제안번호', '일자']
for term in search_terms:
    count = content.count(term)
    print(f"Term: {term}, Remaining Count: {count}")
