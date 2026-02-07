import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()
start = content.find('id=\"pf11\"')
if start != -1:
    # No pf12, so we go to the end or find a likely boundary
    end = content.find('</div></div>', start + 1000)
    if end == -1:
        end = len(content)
    else:
        end += 12 # include closing tags
    
    # Let's get a large enough chunk to see the table
    print(content[start:start+15000].replace('><', '>\n<'))
else:
    print('Page 17 (pf11) not found')
