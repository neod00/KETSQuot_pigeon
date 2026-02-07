import re
path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 최종 제안금액 (Page 2)
# Need to find '최종', '제안금액', 'final_cost'
# Based on screenshot, they are likely in separate divs
p2_start = content.find('id="pf2"')
p2_end = content.find('id="pf3"')
p2 = content[p2_start:p2_end]
print("--- Page 2 Snippet ---")
print(p2[p2.find('최종'):p2.find('최종')+1000])

# Page 15
p15_start = content.find('id="pf15"')
p15_end = content.find('id="pf16"')
p15 = content[p15_start:p15_end]
print("\n--- Page 15 Snippet ---")
print(p15[p15.find('보증수준'):p15.find('보증수준')+1000])

# Page 17
p17_start = content.find('id="pf17"')
p17_end = len(content)
p17 = content[p17_start:p17_end]
print("\n--- Page 17 Snippet ---")
print(p17[p17.find('각각'):p17.find('각각')+1000])

# Page 3
p3_start = content.find('id="pf3"')
p3_end = content.find('id="pf4"')
p3 = content[p3_start:p3_end]
print("\n--- Page 3 Snippet ---")
print(p3[p3.find('검증'):p3.find('검증')+1000])
