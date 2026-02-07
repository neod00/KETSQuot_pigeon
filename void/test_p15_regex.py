import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043]

# The string found was:
# '202<span class="ls45">6</span></span><span class="ff4 ws9">년</span><span class="ff3"> <span class="_ _1"></span><span class="ls6c ws58">12<span class="ff4 ls7 ws9">월<span class="ff3 ws8"> 31<span class="_ _3"> </span></span>일'

# regex to match this fuzzy
pattern = r'202<span[^>]*>6</span></span><span[^>]*>년</span><span[^>]*>\s*<span[^>]*></span><span[^>]*>12<span[^>]*>월<span[^>]*>\s*31<span[^>]*>\s*</span></span>일'

match = re.search(pattern, line_3044)
if match:
    print('Pattern found!')
    print(f'Match: {repr(match.group())}')
else:
    print('Pattern NOT found')
    # Try even simpler regex
    simple_pattern = r'202.*6.*년.*12.*월.*31.*일'
    match2 = re.search(simple_pattern, line_3044)
    if match2:
        print('Simple pattern found!')
        print(f'Match: {repr(match2.group())}')
