import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check Page 10
match_p10 = re.search(r'id=\"pf10\"', content)
if match_p10:
    p10_start = match_p10.start()
    p10_end = content.find('id=\"pf11\"', p10_start)
    print("Page 10 content snippet:")
    # Look for "고객:" or "Address"
    print(content[p10_start:p10_start+5000])

# Check Page 15
match_p15 = re.search(r'id=\"pf15\"', content)
if match_p15:
    p15_start = match_p15.start()
    p15_end = content.find('id=\"pf16\"', p15_start)
    print("Page 15 content snippet:")
    # Look for "마감일"
    idx = content[p15_start:p15_end].find("2026")
    if idx != -1:
        print(content[p15_start+idx-100:p15_start+idx+300])

