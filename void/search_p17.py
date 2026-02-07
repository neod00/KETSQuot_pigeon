import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print("--- Searching for Page 17 signature ---")
# Look for '서명됨' which usually appears in the signature section
for m in re.finditer('서명됨', content):
    start = max(0, m.start() - 300)
    end = min(len(content), m.end() + 100)
    print(content[start:end])
    print("-" * 50)
