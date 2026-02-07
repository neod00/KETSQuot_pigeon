file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Search for reporting_deadline in the WHOLE file
if 'reporting_deadline' in content:
    print('FOUND reporting_deadline in content')
    pos = content.find('reporting_deadline')
    print(f'Context: {repr(content[pos-50:pos+150])}')
else:
    print('NOT FOUND in whole file')

# Search for 2026 12 31 with ANY tags in between
import re
pattern = r'2026[^<]*<[^>]*>[^<]*12[^<]*<[^>]*>[^<]*31'
matches = list(re.finditer(pattern, content))
if matches:
    print(f'Found {len(matches)} fuzzy matches for date')
    for m in matches:
        print(f'Match: {repr(m.group())}')
else:
    print('No fuzzy matches for date')
