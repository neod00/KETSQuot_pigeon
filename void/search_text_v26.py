import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16: total_days search
print("P16 search results:")
for m in re.finditer("total_days", content):
    pos = m.start()
    print(f"Match found at {pos}: {content[pos-100:pos+300]}")

# p15 variables
print("P15 search results:")
v_to_find = ["assurance_level", "materiality_level", "client_representative"]
for v in v_to_find:
    for m in re.finditer(v, content):
        print(f"Match found for {v} at {m.start()}: {content[m.start()-50:m.start()+200]}")

# p10 Address
print("P10 Address segment:")
p10_id = content.find('id="pf10"')
if p10_id != -1:
    print(content[p10_id:p10_id+5000])

