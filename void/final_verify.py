import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's try to detect if h2b or h2a classes are still limiting.
# Snippet showed h2b for parent and h9 for inner.
# Let's verify if our replacement worked.
idx = content.find('{{ target_sites }}')
print(content[idx-1000:idx+500])
