import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
end = content.find('`;', start)
segment = content[start:end]

if 'y267' in segment:
    print('y267 found in segment')
    idx = segment.find('y267')
    print(f'Context: {repr(segment[idx-50:idx+200])}')
else:
    print('y267 NOT found in segment')

if '서명' in segment:
    print('서명 found in segment')
    # Find all occurrences of 서명
    for m in re.finditer('서명', segment):
        print(f'Found at offset {m.start()}: {repr(segment[m.start()-10:m.start()+50])}')
