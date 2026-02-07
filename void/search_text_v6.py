import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Signature table
idx_sig = content.find("SIGNED by")
if idx_sig != -1:
    print(f"P17 Signature context: {content[idx_sig-100:idx_sig+2000]}")

# p15 Deadline search for "마감일"
idx_p15 = content.find('id="pf15"')
if idx_p15 != -1:
    idx_deadline = content.find("마감일", idx_p15, idx_p15 + 15000)
    if idx_deadline != -1:
        print(f"P15 Deadline content: {content[idx_deadline-200:idx_deadline+300]}")

# p10 address
idx_p10 = content.find('id="pf10"')
if idx_p10 != -1:
    # Use re to find "(2) 고객:"
    match = re.search(r'\(2\)\s*고객:', content[idx_p10:idx_p10+5000])
    if match:
        start = idx_p10 + match.start()
        print(f"P10 location: {content[start:start+500]}")

