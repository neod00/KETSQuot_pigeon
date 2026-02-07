import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

print("1. final_cost bold check:")
print(re.findall(r'<div[^>]*style="[^"]*font-weight[^"]*"[^>]*>{{ final_cost }}.*?</div>', content))

print("\n2. P15 spacing check:")
idx = content.find('{{ assurance_level }}')
print(content[idx-100:idx+100])

print("\n3. P17 company_name check:")
idx = content.find('{{ company_name }}')
print(content[idx-100:idx+100])

print("\n4. P3 target_sites check:")
idx = content.find('{{ target_sites }}')
print(content[idx-100:idx+100])
