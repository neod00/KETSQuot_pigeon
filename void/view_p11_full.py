file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
if start != -1:
    end = content.find('</div></div>', start + 100) # Give it some space
    # Find the REAL end of the page
    # Since pf11 is the last page, it goes to the end of the content before "`;"
    end_script = content.find('`;', start)
    print("Page 11 (pf11) Full Content:")
    print(content[start:end_script])
else:
    print("pf11 not found")
