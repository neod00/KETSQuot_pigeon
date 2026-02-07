file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3045 = lines[3044]
for m in re.finditer('verification_year', line_3045):
    print(f'Found at offset {m.start()}')
    print(f'Context: {repr(line_3045[m.start()-50:m.start()+150])}')
