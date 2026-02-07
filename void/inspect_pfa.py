import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()
idx = content.find('id=\"pfa\"')
if idx != -1:
    end = content.find('id=\"pfb\"', idx)
    print(content[idx:end].replace('><', '>\n<'))
