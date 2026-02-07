import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()
for m in re.finditer('SIGNED by', content):
    print(f'Match at {m.start()}:')
    print(content[m.start():m.start()+2000].replace('><', '>\n<'))
    print('-' * 100)
