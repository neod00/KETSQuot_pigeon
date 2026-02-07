import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16 spacing search for total_days
print("Looking for total_days specifically on p16 (likely near end of file)")
for m in re.finditer(r'{{ total_days }}', content):
    print(f"Found total_days at {m.start()}: {content[m.start()-200:m.start()+500]}")

# p15 variables
print("Looking for materiality_level specifically on p15")
for m in re.finditer(r'{{ materiality_level }}', content):
    print(f"Found materiality at {m.start()}: {content[m.start()-200:m.start()+200]}")

# p17 Table labels
print("Looking for 직책 on p17")
for m in re.finditer(r'직책', content):
    if m.start() > 4000000:
        print(f"Found 직책 at {m.start()}: {content[m.start()-100:m.start()+300]}")

