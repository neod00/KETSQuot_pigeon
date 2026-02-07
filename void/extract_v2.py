import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

start_pf3 = content.find('id="pf3"')
end_pf3 = content.find('id="pf4"', start_pf3)
if end_pf3 == -1: end_pf3 = len(content)
p3_content = content[start_pf3:end_pf3]

# Write Page 3 content to a file for review
with open('p3_raw.html', 'w', encoding='utf-8') as f:
    f.write(p3_content)

# Extract style block
style_start = content.find('<style')
style_end = content.find('</style>', style_start) + 8
style_block = content[style_start:style_end]
with open('p3_style.css', 'w', encoding='utf-8') as f:
    f.write(style_block)

print("Extracted P3 and Styles")
