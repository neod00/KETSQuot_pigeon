
import re

file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

found = re.findall(r'{{ [^}]* }}', content)
print(f"Total variables found: {len(found)}")
for var in sorted(list(set(found))):
    print(var)
