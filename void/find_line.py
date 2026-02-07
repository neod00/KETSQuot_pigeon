file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'id=\"pf11\"' in line:
            print(f'Line {i}: {line.strip()[:100]}')
