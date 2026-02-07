import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

pages = ["pfa", "pfb", "pfc", "pfd", "pfe", "pff", "pf10"] # pf10 might be dec or hex
for p in pages:
    idx = content.find(f'id=\"{p}\"')
    print(f"Page {p} found at {idx}")
