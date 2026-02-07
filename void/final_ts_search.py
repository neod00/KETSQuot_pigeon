import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 'final_cost' is definitely in the file.
print("--- total_days occurrences ---")
for m in re.finditer(r'{{ total_days }}', content):
    print(content[m.start()-1000:m.end()+1000])
    print("-" * 50)

print("\n--- final_cost occurrences ---")
for m in re.finditer(r'{{ final_cost }}', content):
    print(content[m.start()-1000:m.end()+1000])
    print("-" * 50)
