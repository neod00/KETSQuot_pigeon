import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()
idx = content.find('SIGNED by')
if idx != -1:
    # Look for the next few boxes/labels
    chunk = content[idx:idx+8000]
    # Try to find labels: '서명', '직책', '성명', '일자'
    print(chunk.replace('><', '>\n<'))
else:
    print('SIGNED by not found')
