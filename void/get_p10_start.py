file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pfa = content.find('id="pfa"')
# Get first 5000 chars of pfa
segment = content[start_pfa:start_pfa+5000]
with open('p10_start.html', 'w', encoding='utf-8') as f:
    f.write(segment)
