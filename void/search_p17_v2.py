import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print("--- Searching for masing-masing LRQA (fragmented) ---")
words = ["각각", "LRQA", "와"]
pattern = r'.*?'.join([re.escape(w) for w in words])
for m in re.finditer(pattern, content):
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 200)
    print(content[start:end])
    print("-" * 50)
