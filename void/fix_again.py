import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix P15 assurance_level again, more precisely
pattern_p15 = r'(<div[^>]*>보증수준.*?)(<span[^>]*>[^<]*</span>)?\s*({{ assurance_level }})(.*?</div>)'
match = re.search(pattern_p15, content, re.S)
if match:
    # Adding spacing fix to the div
    div_start = match.group(1)
    if 'style="' not in div_start:
        new_div_start = div_start.replace('class="', 'style="letter-spacing: normal !important; word-spacing: normal !important;" class="')
    else:
        new_div_start = div_start.replace('style="', 'style="letter-spacing: normal !important; word-spacing: normal !important; ')
    
    new_content = match.group(0).replace(div_start, new_div_start)
    content = content.replace(match.group(0), new_content)
    print("Fixed P15")

# Fix P17 company_name again
pattern_p17 = r'(<div[^>]*>){{ company_name }}(.*?</div>)'
match = re.search(pattern_p17, content)
if match:
    div_start = match.group(1)
    if 'style="' not in div_start:
        new_div_start = div_start.replace('class="', 'style="letter-spacing: normal !important; word-spacing: normal !important;" class="')
    else:
        new_div_start = div_start.replace('style="', 'style="letter-spacing: normal !important; word-spacing: normal !important; ')
    
    new_content = match.group(0).replace(div_start, new_div_start)
    content = content.replace(match.group(0), new_content)
    print("Fixed P17")

with open('web-app/src/constants/template.ts', 'w', encoding='utf-8') as f:
    f.write(content)
