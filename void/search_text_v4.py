import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16: "해당 프로젝트는..."
# Let's find "해당" and "프로젝트는" near each other
print("Searching for p16 sentence components...")
idx_haedang = content.find("해당", 4400000)
while idx_haedang != -1:
    context = content[idx_haedang:idx_haedang+500]
    if "프로젝트는" in context:
        print(f"Found target sentence at {idx_haedang}")
        print(context)
        break
    idx_haedang = content.find("해당", idx_haedang + 1)

# p17: Search for the table content precisely
print("Searching for p17 signature table labels...")
idx_label = content.find("사명:", 4600000) # Should be 서명:
if idx_label == -1:
     idx_label = content.find("서명:", 4600000)

if idx_label != -1:
    print(f"Found signature label at {idx_label}: {content[idx_label-50:idx_label+1000]}")

# p15: Search for "2026년 12월 31일"
print("Searching for 2026-12-31 on p15...")
idx_p15 = content.find('id="pf15"')
if idx_p15 != -1:
    idx_date = content.find("2026", idx_p15, idx_p15 + 10000)
    if idx_date != -1:
        print(f"Found date at {idx_date}: {content[idx_date-50:idx_date+150]}")

