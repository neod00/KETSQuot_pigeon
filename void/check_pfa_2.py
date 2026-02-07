import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pfa = content.find('id="pfa"')
if start_pfa != -1:
    end_pfa = content.find('id="pfb"', start_pfa)
    segment = content[start_pfa:end_pfa]
    
    # Search for "(2)"
    match = re.search(r'\(2\)', segment)
    if match:
        print(f'Found "(2)" on page pfa at rel offset {match.start()}')
        # Context around it
        print(repr(segment[match.start():match.start()+1000]))
    else:
        print('"(2)" not found on pfa')
else:
    print('pfa not found')
