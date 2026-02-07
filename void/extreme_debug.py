import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 'target_sites' is at 4159201 based on previous tool call
idx = 4159201
print("Target snippet at 4159201:")
print(content[idx-1000:idx+1000])
