import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16 spacing
idx_16 = content.find("해당 프로젝트는")
if idx_16 != -1:
    print(f"P16 sentence: {content[idx_16-10:idx_16+300]}")

# p17 signature table
# Look for "직책:" and "성명:"
idx_jik = content.find("직책:", 4600000)
if idx_jik != -1:
    print(f"P17 label 직책: found at {idx_jik}: {content[idx_jik-100:idx_jik+1000]}")

# p10 address
idx_p10 = content.find('id="pf10"')
if idx_p10 != -1:
    idx_cust_10 = content.find("(2) 고객:", idx_p10, idx_p10 + 5000)
    if idx_cust_10 != -1:
        print(f"P10 customer line: {content[idx_cust_10:idx_cust_10+600]}")

# p15 deadline
idx_p15 = content.find('id="pf15"')
if idx_p15 != -1:
    # Look for "2026년 12월 31일"
    # Maybe it's fragmented
    idx_2026 = content.find("2026", idx_p15, idx_p15+10000)
    if idx_2026 != -1:
        print(f"P15 date context: {content[idx_2026-100:idx_2026+500]}")

