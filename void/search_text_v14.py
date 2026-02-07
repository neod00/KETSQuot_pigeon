import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

# p17 Table Analysis - let's search for "SIGN" and see everything
print("P17 Signature context:")
idx_sig = content.find("SIGNED")
while idx_sig != -1:
    print(f"Found SIGNED at {idx_sig}: {content[idx_sig-50:idx_sig+150]}")
    idx_sig = content.find("SIGNED", idx_sig + 1)

# Search for labels near the end of the file
print("Labels near the end:")
print(content[-50000:])

