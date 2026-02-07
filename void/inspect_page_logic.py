import re

path = 'web-app/src/app/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    page_content = f.read()

# p16: total_days search results
print("Looking for total_days in page.tsx to see how it's used:")
print(page_content[page_content.find('total_days'):page_content.find('total_days')+200])

# Find the template replacements in page.tsx
print("Template replacements in page.tsx:")
print(page_content[page_content.find('.replace'):page_content.find('.replace')+2000])

