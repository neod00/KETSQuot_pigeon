import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract Page 3 (id="pf3")
start_pf3 = content.find('id="pf3"')
end_pf3 = content.find('id="pf4"', start_pf3)
if end_pf3 == -1: end_pf3 = len(content)

p3_content = content[start_pf3:end_pf3]

# Extract styles related to Page 3
# Usually styles are in <style> tags before the body or at the beginning of the file.
# We'll just grab the first 5000 chars of the file to see CSS classes.
print("--- CSS CLASSES SNIPPET ---")
print(content[:5000])

print("\n--- PAGE 3 RAW CONTENT ---")
print(p3_content)
