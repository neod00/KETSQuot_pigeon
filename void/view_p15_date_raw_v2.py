file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043]
print(repr(line_3044[17600:18000]))
