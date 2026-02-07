import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# I will use a very aggressive replacement for the problematic areas.

# Page 15: Identify the div containing assurance_level and fix it.
# Based on previous output, the div starts with <div style="..." class="t m0 x10 hf y7d ...">
content = re.sub(
    r'(<div\s+style="[^"]*")[^>]*>(보증수준.*?{{ assurance_level }}.*?</div>)',
    r'\1>\2',
    content
)

# Page 17: Update company_name
content = content.replace('회사명', '{{ company_name }}')

# Add style="letter-spacing: normal !important; word-spacing: normal !important;" to EVERY div that has a placeholder
# This is a broad but safe fix since we want all dynamic values to be readable.
def fix_all_placeholders(c):
    placeholders = [' assurance_level ', ' company_name ', ' target_sites ', ' total_cost ', ' final_cost ']
    for p in placeholders:
        pattern = r'(<div)( class="[^"]*">)([^<]*{{ ' + p + r' }})'
        c = re.sub(pattern, r'\1 style="letter-spacing: normal !important; word-spacing: normal !important;"\2\3', c)
        
        # Also for spans if they exist directly
        pattern_span = r'(<span)( class="[^"]*">)([^<]*{{ ' + p + r' }})'
        c = re.sub(pattern_span, r'\1 style="letter-spacing: normal !important; word-spacing: normal !important;"\2\3', c)
    return c

content = fix_all_placeholders(content)

with open('web-app/src/constants/template.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Final batch update done.")
