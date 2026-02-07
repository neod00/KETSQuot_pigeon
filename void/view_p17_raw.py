file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3046 = lines[3045]
pos = line_3046.find('SIGNED by')
if pos != -1:
    print(f'Context around SIGNED by:')
    print(repr(line_3046[pos-100:pos+2000]))
else:
    print('SIGNED by not found in line 3046')
