file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('id=\"pf11\"')
if start_idx != -1:
    # Read Page 17 content (approx 15000 chars should be enough for one page)
    # But let's find the closing for pf11 to be precise
    end_idx = content.find('id=\"pf12\"', start_idx) 
    if end_idx == -1:
        end_idx = content.find(';', start_idx) # End of constant
    
    page_content = content[start_idx:end_idx]
    print(page_content)
else:
    print('pf11 not found')
