import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's search for 'target_sites' and check the applied styles.
idx = content.find('target_sites')
if idx != -1:
    print("CURRENT SNIPPET AROUND target_sites:")
    # Look back for the 'c ' class
    start = content.rfind('<div', 0, idx)
    start_outer = content.rfind('<div', 0, start-1)
    print(content[start_outer:idx+200])
else:
    print("target_sites NOT FOUND")
