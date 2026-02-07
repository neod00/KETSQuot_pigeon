import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's search for 'target_sites' and print the surrounding 2000 chars to find where it is.
idx = content.find('target_sites')
if idx != -1:
    print(f"Target sites at {idx}")
    print(content[idx-1000:idx+1000])
else:
    print("Not found")
