import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Page 10 hq_address check
# Find where hq_address should be on page 10. 
# Re-running the search for hq_address across the whole file to see if it's missing on p10.
print("Searching for hq_address occurrences...")
matches = [m.start() for m in re.finditer(r'{{ hq_address }}', content)]
print(f"Found at: {matches}")

# 2. Page 15 assurance_level font check
# Find the div containing assurance_level on p15
match_p15 = re.search(r'id=\"pf15\"', content)
if match_p15:
    p15_start = match_p15.start()
    p15_end = content.find('id=\"pf16\"', p15_start)
    p15_content = content[p15_start:p15_end]
    print("Page 15 content snippet around assurance_level:")
    idx = p15_content.find('{{ assurance_level }}')
    if idx != -1:
        print(p15_content[idx-200:idx+200])

# 3. Page 16 spacing check
match_p16 = re.search(r'id=\"pf16\"', content)
if match_p16:
    p16_start = match_p16.start()
    p16_end = content.find('id=\"pf17\"', p16_start)
    p16_content = content[p16_start:p16_end]
    print("Page 16 content snippet (spacing issue):")
    # Search for "해당 프로젝트는"
    idx = p16_content.find('해당')
    if idx != -1:
        print(p16_content[idx:idx+300])

# 4. Page 17 table check
match_p17 = re.search(r'id=\"pf17\"', content)
if match_p17:
    p17_start = match_p17.start()
    p17_end = len(content)
    p17_content = content[p17_start:p17_end]
    print("Page 17 table snippet:")
    print(p17_content[p17_content.find('SIGNED by'):p17_content.find('SIGNED by')+1000])

