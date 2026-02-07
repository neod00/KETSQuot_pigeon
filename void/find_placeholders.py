import re
with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Just search for 'final_cost' without the brackets if they were removed
print("Searching for final_cost variations:")
for m in re.finditer(r'final_cost', html):
    print(html[m.start()-500:m.end()+500])
    print("-" * 50)

print("\nSearching for total_days variations:")
for m in re.finditer(r'total_days', html):
    print(html[m.start()-500:m.end()+500])
    print("-" * 50)
