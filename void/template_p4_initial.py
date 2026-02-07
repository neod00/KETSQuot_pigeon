
from bs4 import BeautifulSoup, NavigableString
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')
pf4 = soup.find('div', id='pf4')

# Mapping for Page 4
replacements = {
    '1.0 days': '{{ stage1_days }} days',
    '3.0 days': '{{ stage2_days }} days',
    '2.0 days': '{{ stage3_days }} days',
    '6.0 days': '{{ total_days }} days',
    '1,350,000': '{{ stage1_cost }}',
    '4,050,000': '{{ stage2_cost }}',
    '2,700,0': '{{ stage3_cost_prefix }}', # Note: 2,700,000 is split in HTML
    '00': '{{ stage3_cost_suffix }}',
    '400,000': '{{ expenses }}',
    '8,500,0': '{{ total_cost_prefix }}',
    '8,000,000': '{{ final_cost }}',
    '90': '{{ quote_validity_days }}',
}

# Special handling for 신청비 (Application Fee)
# If it's "면제 (720,000)", we might want to make the whole thing a variable
# Or just the part inside. Let's see how it's structured.
# <div class="t m0 x1a h10 ya2 ff5 fs7 fc0 sc0 ls7 ws4"> 면제 <span class="ff2 ls44"> ( <span class="lsa ws1c"> 720 <span class="ls7 ws8"> ,000) </span> </span> </span> </div>

for element in pf4.find_all(['div', 'span']):
    if any(not isinstance(c, NavigableString) for c in element.children):
        continue
    
    text = element.get_text().strip()
    
    # Handle exact matches or partial splits
    if text == '1.0 days':
        element.string = '{{ stage1_days }} days'
    elif text == '3.0 days':
        element.string = '{{ stage2_days }} days'
    elif text == '2.0 days':
        element.string = '{{ stage3_days }} days'
    elif text == '6.0 days':
        element.string = '{{ total_days }} days'
    elif text == '1,350,000':
        # Need to check context for the audit rate as well
        # In Additi onal Notes: 1, 350,000
        # In Table: 1,350,000
        element.string = '{{ stage1_cost }}'
    elif text == '4,050,000':
        element.string = '{{ stage2_cost }}'
    elif text == '2,700,0':
        element.string = '{{ stage3_cost_base }}'
    elif text == '00':
        # This '00' appears multiple times (2,700,000, 8,500,000)
        # We need to be careful.
        # Let's check parent or context.
        pass
    elif text == '400,000':
        element.string = '{{ expenses }}'
    elif text == '8,000,000':
        element.string = '{{ final_cost }}'
    elif text == '90':
         element.string = '{{ quote_validity_days }}'
    elif '1,350,000' in text and '원/day' in element.parent.get_text():
         # Audit rate in notes
         pass

# Re-run a more targeted replacement for the digits and costs which are split
# I'll use regex on the page string for these delicate ones.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Initial BS4 pass for Page 4 done.")
