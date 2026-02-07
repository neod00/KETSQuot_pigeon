import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16 Spacing
print("P16 search for total_days:")
idx_days = content.find("{{ total_days }}")
if idx_days != -1:
    print(f"Found it at {idx_days}")
    print(content[idx_days-100:idx_days+500])

# p15 variables
print("P15 search for assurance_level:")
idx_as = content.find("{{ assurance_level }}")
if idx_as != -1:
    print(f"Found it at {idx_as}")
    print(content[idx_as-200:idx_as+200])

# p17 Signature table
print("P17 Signature search (Korea Limited):")
idx_sig = content.rfind("LRQA Korea Limited")
if idx_sig != -1:
    print(content[idx_sig-1000:idx_sig+3000])

# p10 Address
print("P10 Address search (id=pf10):")
idx_p10 = content.find('id="pf10"')
if idx_p10 != -1:
    print(content[idx_p10:idx_p10+10000])

