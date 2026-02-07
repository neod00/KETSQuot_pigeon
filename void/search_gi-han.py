import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043] # Page 15
line_3045 = lines[3044] # Page 16

print("Checking Page 15 (Line 3044) for '기한':")
for m in re.finditer('기한', line_3044):
    print(f'Found "기한" at offset {m.start()}')
    print(f'Context: {repr(line_3044[m.start()-50:m.start()+150])}')

print("\nChecking Page 16 (Line 3045) for '기한':")
for m in re.finditer('기한', line_3045):
    print(f'Found "기한" at offset {m.start()}')
    print(f'Context: {repr(line_3045[m.start()-50:m.start()+150])}')
