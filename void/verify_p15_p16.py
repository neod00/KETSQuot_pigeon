import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check assurance_level styling
found_assurance = re.findall(r'<span[^>]*font-weight:\s*700\s*!important[^>]*>\s*\{\{\s*assurance_level\s*\}\}\s*</span>', content)
print(f'Assurance level styled count: {len(found_assurance)}')

# Check reporting_deadline
if '{{ reporting_deadline }}' in content:
    print('reporting_deadline placeholder found')
else:
    print('reporting_deadline placeholder NOT found')

# Check Page 16 spacing
if '해당 프로젝트는 {{ total_days }} 일이 소요될 것이다' in content:
    print('P16 text found')
    p16_idx = content.find('해당 프로젝트는 {{ total_days }} 일이 소요될 것이다')
    print(f'P16 context: {repr(content[p16_idx-50:p16_idx+150])}')
