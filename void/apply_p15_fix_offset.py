import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.splitlines()
line_3044 = lines[3043]

start = 17658
# Find "일" after start
end = line_3044.find('일', start)
if end != -1:
    old_str = line_3044[start:end+1]
    print(f'Replacing: {repr(old_str)}')
    new_line = line_3044[:start] + '{{ reporting_deadline }}' + line_3044[end+1:]
    lines[3043] = new_line
    
    new_content = "\n".join(lines)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Replaced Page 15 deadline by offset.")
else:
    print("FAILED: Could not find '일' by offset.")
