file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pff = content.find('id="pff"')
if start_pff != -1:
    end_pff = content.find('id="pf10"', start_pff) # pf10 follows pff? Or pfg?
    if end_pff == -1:
         end_pff = content.find('id="pf11"', start_pff)
    
    segment = content[start_pff:end_pff]
    print(f"Segment length: {len(segment)}")
    # Remove large base64 data to find text
    text_only = re.sub(r'data:image/[^;]+;base64,[^"]+', '[IMAGE]', segment)
    print("Text version of Page 15 (pff):")
    print(text_only[:2000])
else:
    print("pff not found")
