import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16 spacing search for "일이 소요될 것이다"
print("P16 search results:")
for m in re.finditer("일이", content):
    pos = m.start()
    if pos > 4000000:
        print(f"Match found at {pos}: {content[pos-50:pos+150]}")

# p15 search for materiality
print("P15 search results:")
for m in re.finditer("{{ materiality_level }}", content):
    print(f"Match found at {m.start()}")

# p10 Search for "(2)"
print("P10 search results:")
for m in re.finditer("\(2\)", content):
    pos = m.start()
    if 3000000 < pos < 4000000:
        print(f"Match found at {pos}: {content[pos-10:pos+300]}")

