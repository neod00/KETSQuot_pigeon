import re
import sys

def find_and_context(content, pattern, context_size=500):
    for match in re.finditer(pattern, content):
        start = max(0, match.start() - context_size)
        end = min(len(content), match.end() + context_size)
        print(f"Match found at index {match.start()}:")
        print("-" * 20)
        print(content[start:end].replace('><', '>\n<'))
        print("-" * 20)

with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

print("Searching for Page 10 markers...")
# Look for "(2) 고객:" which often precedes the address
find_and_context(content, r'\(2\)\s*고객:')

print("\nSearching for Page 15 markers...")
# Look for "보증수준" and "2026년 12월 31일"
find_and_context(content, r'보증수준')
find_and_context(content, r'2026년 12월 31일')

print("\nSearching for Page 16 markers...")
# Look for "해당 프로젝트는"
find_and_context(content, r'해당.*?프로젝트는')

print("\nSearching for Page 17 markers...")
# Look for "SIGNED by"
find_and_context(content, r'SIGNED by')
