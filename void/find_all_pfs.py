import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()
matches = re.findall(r'id=\"(pf[0-9a-f]+)\"', content)
print(matches)
