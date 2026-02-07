import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Look for '최종' with fragmented letters possibly
# '최종' -> \xec\xbb\xec\xa2\x85 in utf-8
# Let's search for sequences of <span>...</span>
print("--- Searching for P2 Total Cost context ---")
for m in re.finditer(r'최종', content):
    print(content[m.start()-100:m.end()+1000])
    print("-" * 50)

print("\n--- Searching for P15 Assurance context ---")
for m in re.finditer(r'보증수준', content):
    print(content[m.start()-100:m.end()+1000])
    print("-" * 50)

print("\n--- Searching for P17 Company Name context ---")
for m in re.finditer(r'각각', content):
    print(content[m.start()-100:m.end()+1000])
    print("-" * 50)

print("\n--- Searching for P3 Target Sites context ---")
for m in re.finditer(r'검증', content):
    print(content[m.start()-100:m.end()+1000])
    print("-" * 50)
