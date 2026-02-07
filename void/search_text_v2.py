import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p10 hq_address search
p10_id = content.find('id="pf10"')
if p10_id != -1:
    print("P10 area found")
    # Search for (2) 고객:
    idx_cust = content.find('(2)', p10_id, p10_id + 5000)
    if idx_cust != -1:
        print(f"Found (2) at {idx_cust}: {content[idx_cust:idx_cust+500]}")

# p15 variables
p15_id = content.find('id="pf15"')
if p15_id != -1:
    print("P15 area found")
    # Search for '보증수준' and '중요성 기준'
    idx_bo = content.find('보증수준', p15_id, p15_id + 10000)
    if idx_bo != -1:
         print(f"Found 보증수준 at {idx_bo}: {content[idx_bo-50:idx_bo+200]}")
    idx_jung = content.find('중요성 기준', p15_id, p15_id + 10000)
    if idx_jung != -1:
         print(f"Found 중요성 기준 at {idx_jung}: {content[idx_jung-50:idx_jung+200]}")

# p16 spacing issue
# The previous search found it at 4628295
pos_16 = 4628295
print(f"Content at 4628295: {content[pos_16-100:pos_16+500]}")

# p17 table
# Previous search found SIGNED by at 4670694
pos_17 = 4670694
print(f"Content at p17 table: {content[pos_17-100:pos_17+1500]}")

