file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Page 15 is pff
# Page 17 is pf11
# Page 3 is pf3

pages = ['pf3', 'pf10', 'pff', 'pf11']
for p in pages:
    idx = -1
    for i, line in enumerate(lines):
        if f'id="{p}"' in line:
            idx = i
            break
    if idx != -1:
        print(f'Page {p} starts at line {idx+1}')
        # Print a bit of it
        content = "".join(lines[idx:idx+10])
        print(f'Snippet: {repr(content[:500])}')
    else:
        print(f'Page {p} not found')
