import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for the ID in a more flexible way
for match in re.finditer(r'id=["\']pf3["\']', content):
    print(f"Found id='pf3' at {match.start()}")
    print(content[match.start()-50:match.start()+200])
