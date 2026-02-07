file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043]
start = 17658
end = line_3044.find('일', start)
if end != -1:
    print(f'Actual string: {repr(line_3044[start:end+1])}')
else:
    print('Could not find "일" after start')
