import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# p16: search for "해당 프로젝트는"
idx_16 = content.find("해당 프로젝트는")
if idx_16 != -1:
    print(f"P16: {content[idx_16-100:idx_16+500]}")

# p15: search for "보증수준"
idx_15 = content.find("보증수준")
if idx_15 != -1:
    print(f"P15: {content[idx_15-100:idx_15+1000]}")

# p10 address: search for "(2) 고객:"
match = re.search(r'\(2\)\s*고객:', content)
if match:
    print(f"P10 location at {match.start()}")
    print(content[match.start():match.start()+500])

# p17: search for labels
for l in ["서명:", "직책:", "성명:", "일자:"]:
    pos = content.find(l)
    if pos != -1:
        print(f"P17 label {l} at {pos}: {content[pos-100:pos+500]}")

