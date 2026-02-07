
import re
path = r'd:\OneDrive\Business\ai automation\LRQA_AutoQuot\KETSQuot\web-app\src\constants\template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def get_div_context(idx):
    start = content.rfind('<div', 0, idx)
    end = content.find('</div>', idx) + 6
    return content[start:end]

placeholders = re.findall(r'{{ (.*?) }}', content)
results = []
for p in set(placeholders):
    full = f"{{{{ {p} }}}}"
    idx = content.find(full)
    ctx = get_div_context(idx)
    if '[' in ctx or ']' in ctx:
        results.append((p, ctx))

print(f"Found {len(results)} bracketed placeholders:")
for p, ctx in results:
    print(f"\n{p}:\n{ctx}")
