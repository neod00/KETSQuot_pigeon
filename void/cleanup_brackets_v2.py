
import re
path = r'd:\OneDrive\Business\ai automation\LRQA_AutoQuot\KETSQuot\web-app\src\constants\template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

vars_to_fix = ['company_name', 'hq_address', 'target_sites']

for var in vars_to_fix:
    # Remove '[' that appears BEFORE the placeholder (even if there are tags in between)
    # We'll look for a '[' in the 50 chars before '{{ var }}' stay inside the same tag if possible.
    # For pdf2htmlEX, '[' is often right before a <span> or just before the variable.
    
    pattern_left = r'\[(<span[^>]*>)?({{\s*' + var + r'\s*}})'
    content = re.sub(pattern_left, r'\1\2', content)
    
    pattern_right = r'({{\s*' + var + r'\s*}})(</span>[^<]*?)?\]'
    content = re.sub(pattern_right, r'\1\2', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done generic bracket removal.")
