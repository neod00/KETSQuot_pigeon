file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_idx = 3038 # 3039 is 1-indexed
line = lines[line_idx]
print(f'Line {line_idx+1}:')
print(repr(line))

# Search for "본사 주소" context in this line
pos = line.find('본사')
if pos != -1:
    print(f'Context: {repr(line[pos-50:pos+200])}')
else:
    print('"본사" not found in line 3039')
