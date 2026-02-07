import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find the p3 page container 'pf3'
idx_pf3 = content.find('id="pf3"')
if idx_pf3 != -1:
    idx_target = content.find('target_sites', idx_pf3)
    if idx_target != -1:
        # Get a larger chunk
        print(content[idx_target-500:idx_target+500])
