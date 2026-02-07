import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's search for 'target_sites' and print the surrounding text ONE MORE TIME.
idx = content.find('{{ target_sites }}')
if idx != -1:
    print(content[idx-500:idx+500])
else:
    print("Not found")
