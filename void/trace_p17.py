file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(3045, len(lines)): # Start from line 3046
    line = lines[i]
    if 'id=' in line:
        page_id = line[line.find('id="')+4:line.find('"', line.find('id="')+4)]
        print(f'Line {i+1} starts page {page_id}')
    
    if '직책' in line:
        print(f'Line {i+1} contains "직책"')
    if '{{' in line:
        # Print placeholders found
        import re
        ph = re.findall(r'\{\{\s*\w+\s*\}\}', line)
        if ph:
            print(f'Line {i+1} placeholders: {ph}')
