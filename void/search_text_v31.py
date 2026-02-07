import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16: total_days search results
print("P16 segment:")
for m in re.finditer("total_days", content):
    p = m.start()
    print(f"Match at {p}: {content[p-300:p+500]}")

# p15 variables
print("P15 segment vars:")
for m in re.finditer("assurance_level", content):
    p = m.start()
    print(f"assurance_level at {p}: {content[p-300:p+200]}")

# p17 search for " Korea Limited"
print("P17 signature area:")
idx_kl = content.find("Korea Limited")
if idx_kl != -1:
    print(f"KL at {idx_kl}: {content[idx_kl-1000:idx_kl+2000]}")

