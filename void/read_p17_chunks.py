file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('id=\"pf11\"')
if start_idx != -1:
    end_idx = content.find('id=\"pf12\"', start_idx) 
    if end_idx == -1:
        end_idx = content.find(';', start_idx)
    
    page_content = content[start_idx:end_idx]
    # Print in chunks to avoid terminal truncation
    chunk_size = 2000
    for i in range(0, len(page_content), chunk_size):
        print(f'Chunk {i//chunk_size}:')
        print(page_content[i:i+chunk_size])
        print('---')
else:
    print('pf11 not found')
