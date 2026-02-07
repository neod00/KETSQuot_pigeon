import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# I KNOW total_days is there. Search for it.
print("Searching total_days in template.ts:")
idx = content.find('total_days')
if idx != -1:
    print(content[idx-500:idx+500])
else:
    print("total_days NOT FOUND in template.ts (?!?)")

# Try without spaces
idx2 = content.find('{{total_days}}')
if idx2 != -1:
    print("Found {{total_days}} (no spaces)")
