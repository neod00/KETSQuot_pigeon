import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# Search for "대표이사" or {{ client_representative_title }} near the end
idx = content.find('{{ client_representative_title }}')
if idx != -1:
    print(f"DEBUG: Found client_representative_title at {idx}")
    print(content[idx-500:idx+500])

idx2 = content.find('{{ client_representative_name }}')
if idx2 != -1:
    print(f"DEBUG: Found client_representative_name at {idx2}")
    print(content[idx2-500:idx2+500])
