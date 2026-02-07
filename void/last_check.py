import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find exactly what text is around '보증수준' in template.ts
idx = content.find('보증수준')
print("P15 Around '보증수준':")
print(content[idx-100:idx+300])

idx2 = content.find('{{ company_name }}')
print("\nP17 Around 'company_name':")
print(content[idx2-100:idx2+300])

idx3 = content.find('{{ target_sites }}')
print("\nP3 Around 'target_sites':")
print(content[idx3-100:idx3+300])
