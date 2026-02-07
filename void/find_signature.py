import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all occurrences of SIGNED by
matches = [m.start() for m in re.finditer('SIGNED by', content)]
for pos in matches:
    print(f'Occurrence at {pos}:')
    # Get a chunk around the match
    start = max(0, pos - 500)
    end = min(len(content), pos + 3000)
    print(content[start:end])
    print('-' * 80)
