file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line = lines[3038] # Line 3039
print(f'Line length: {len(line)}')
pos = line.find('본사')
if pos != -1:
    print(f'Context: {repr(line[pos-50:pos+200])}')
else:
    print('"본사" not found in line 3039')
