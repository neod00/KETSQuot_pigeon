import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
end = content.find('`;', start)
segment = content[start:end]

for m in re.finditer('x40', segment):
    print(f'x40 at {m.start()}: {repr(segment[m.start():m.start()+100])}')
