import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16: total_days search results
print("P16 sentence inspection:")
pos_16 = 4591563 # From previous materiality match on p15? Actually p16 total_days was found at 4158689
print(f"Content at 4158689: {content[4158689-500:4158689+1500]}")

# p15 variables - materiality_level was at 4591563
print(f"Content at 4591563: {content[4591563-500:4591563+1000]}")

# p10 Address
print("P10 Address segment scan:")
p10_id = content.find('id="pf10"')
if p10_id != -1:
    print(content[p10_id:p10_id+5000])

