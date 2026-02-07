file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check assurance_level styling
found_assurance = re.findall(r'<span[^>]*font-weight:\s*700\s*!important[^>]*>\s*\{\{\s*assurance_level\s*\}\}\s*</span>', content)
print(f'Assurance level styled: {len(found_assurance) > 0}')

# Check reporting_deadline
if '{{ reporting_deadline }}' in content:
    print('reporting_deadline placeholder found')
else:
    print('reporting_deadline placeholder NOT found')
