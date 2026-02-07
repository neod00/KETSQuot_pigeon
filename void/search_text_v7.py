import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p17 Signature table
idx_sig = content.find("SIGNED by")
if idx_sig != -1:
    print(f"P17 Signature context start: {idx_sig}")
    idx_jik = content.find("직책", idx_sig, idx_sig + 3000)
    if idx_jik != -1:
        print(f"jik found at {idx_jik}: {content[idx_jik-50:idx_jik+200]}")
    idx_name = content.find("성명", idx_sig, idx_sig + 3000)
    if idx_name != -1:
        print(f"name found at {idx_name}: {content[idx_name-50:idx_name+200]}")
    idx_date = content.find("일자", idx_sig, idx_sig + 3000)
    if idx_date != -1:
        print(f"date found at {idx_date}: {content[idx_date-50:idx_date+200]}")

# p10 address
idx_p10 = content.find('id="pf10"')
if idx_p10 != -1:
    # Let's just look at the text after id="pf10"
    print(f"P10 raw text: {content[idx_p10:idx_p10+3000]}")

