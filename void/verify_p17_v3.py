import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('id="pf11"')
end = content.find('`;', start)
segment = content[start:end]

labels = ['서명:', '직책:', '성명:', '일자:']
for label in labels:
    # Match label with optional spaces and tags between text and colon
    # User specifically used </span>: </span> or similar in their fix
    # So we check for just the text
    simple_label = label.replace(':', '')
    if simple_label in segment:
        print(f'Found "{simple_label}"')
        # Check if colon follows
        pos = segment.find(simple_label)
        context = segment[pos:pos+100]
        print(f'Context: {repr(context)}')
    else:
        print(f'"{simple_label}" NOT found')

placeholders = ['{{ client_representative_name }}', '{{ client_representative_title }}', '{{ proposal_date_korean_long }}']
for p in placeholders:
    if p in segment:
        print(f'Found placeholder "{p}"')
    else:
        print(f'Placeholder "{p}" NOT found')
