import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
end = content.find('`;', start)
segment = content[start:end]

# Find "x40" which is the label box x-offset
for m in re.finditer('x40', segment):
    print(f'x40 at {m.start()}')
    print(f'Context: {repr(segment[m.start():m.start()+200])}')
