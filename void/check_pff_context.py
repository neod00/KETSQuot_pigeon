file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

offset = 4603091
print(f'Context around {offset}:')
print(repr(content[offset-100:offset+500]))
