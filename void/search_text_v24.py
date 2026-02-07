import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16: total_days search
for m in re.finditer("total_days", content):
    print(f"total_days at {m.start()}: {content[m.start()-100:m.start()+200]}")

# p15: materiality search
for m in re.finditer("materiality_level", content):
    print(f"materiality at {m.start()}: {content[m.start()-100:m.start()+200]}")

# p10 address (2) 고객 search
print("P10 customer line search:")
for m in re.finditer("\(2\)\s*고객:", content):
    print(f"customer line at {m.start()}: {content[m.start():m.start()+300]}")

