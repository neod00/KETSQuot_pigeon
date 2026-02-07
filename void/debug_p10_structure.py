file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_idx = 3038
line = lines[line_idx]
pos = line.find('본사')
if pos != -1:
    # Print 500 characters around it to see tags
    print(repr(line[pos-100:pos+400]))
else:
    print('"본사" not found')
