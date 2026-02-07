
import re
path = r'd:\OneDrive\Business\ai automation\LRQA_AutoQuot\KETSQuot\web-app\src\constants\template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

placeholders = re.findall(r'{{ (.*?) }}', content)
print(f"Found {len(placeholders)} placeholders.")

brackets_found = []
for p in set(placeholders):
    full = f"{{{{ {p} }}}}"
    idx = content.find(full)
    # Check 5 chars before and after
    context = content[max(0, idx-10):idx+len(full)+10]
    if '[' in context or ']' in context:
        brackets_found.append((p, context))

print("\nPlaceholders with brackets in context:")
for p, ctx in brackets_found:
    print(f"{p}: ...{ctx}...")
