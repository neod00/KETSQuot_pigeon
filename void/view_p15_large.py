file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043]
offset = 16162
print(f'Large context around {offset}:')
print(repr(line_3044[offset-1000:offset+3000]))
