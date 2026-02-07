import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's search for 'c x1' which usually defines table cells in pdf2htmlEX
# And see if height hX classes are used.
# {{ target_sites }} is in a div with class 't' inside a div with class 'c'
# The 'c' div usually has a height class like h2a.

idx = content.find('target_sites')
if idx != -1:
    # Find the nearest previous <div class="c
    start = content.rfind('<div class="c', 0, idx)
    if start != -1:
        end = content.find('</div>', idx) + 14 # roughly next div
        print("CONTAINER SNIPPET:")
        print(content[start:idx+500])
