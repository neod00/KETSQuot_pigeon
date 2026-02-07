import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pos = content.find('주소: </span><span style="letter-spacing: normal !important;')
if pos != -1:
    print("Verification: New structure found!")
    print(repr(content[pos-100:pos+300]))
else:
    print("Verification FAILED: New structure NOT found.")
