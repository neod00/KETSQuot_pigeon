import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()
idx = content.find('id=\"pf11\"')
print(f"Page pf11 found at {idx}")
