import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inspect P4 Labels
print("=== Searching for P4 Labels near {{ final_cost }} ===")
pos = content.find('{{ final_cost }}')
if pos != -1:
    # Print 1000 chars before to find the labels
    context = content[pos-1000:pos] # Look before
    print(context)
else:
    print("{{ final_cost }} not found!")

# 2. Check P10 HQ Address
print("\n=== Checking P10 HQ Address ===")
if '{{ hq_address }}' in content:
    print("'{{ hq_address }}' IS PRESENT.")
    # Show context to ensure it's in a valid div
    h_pos = content.find('{{ hq_address }}')
    print(content[h_pos-100:h_pos+200])
else:
    print("'{{ hq_address }}' is STILL MISSING.")
