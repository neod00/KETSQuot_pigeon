file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('id="pff"')
print(f'id="pff" found at {pos}')
if pos != -1:
    print(f'Context: {repr(content[pos:pos+100])}')

target_pos = 4591416
print(f'Target pos 4591416 is {target_pos - pos} from pff')
