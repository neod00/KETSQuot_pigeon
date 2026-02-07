file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_3044 = lines[3043]
start = line_3044.find('202')
# There might be multiple 202, let's look for one with "년" nearby
while start != -1:
    context = line_3044[start:start+500]
    if '년' in context and '12' in context and '31' in context:
        print(f'Found likely target at offset {start}')
        # Find the end '일'
        end_idx = context.find('일')
        if end_idx != -1:
             exact_string = context[:end_idx+1]
             print(f'Exact string to replace: {repr(exact_string)}')
        break
    start = line_3044.find('202', start+1)
