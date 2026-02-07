import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Search for the placeholder with braces
idx = content.find('{{ target_sites }}')
if idx != -1:
    print("Found at", idx)
    print(content[idx-300:idx+300])
else:
    # Maybe it was wrapped in a span or something by previous script
    # Look for partial match
    print("Searching for target_sites...")
    for m in re.finditer(r'target_sites', content):
        print(f"Match at {m.start()}:")
        print(content[m.start()-100:m.end()+100])
