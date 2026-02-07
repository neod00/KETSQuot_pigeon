file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check for the components individually
components = [
    '202',
    '<span class="ls45">6</span>',
    '년',
    '12',
    '31',
    '일'
]

for c in components:
    if c in content:
        print(f'"{c}" found')
    else:
        print(f'"{c}" NOT found')

# Let's find exactly what is between '202' and '일' near offset 17658 in Line 3044
lines = content.splitlines()
line_3044 = lines[3043]
target = line_3044[17658:17658+150]
print(f'Target at offset: {repr(target)}')
