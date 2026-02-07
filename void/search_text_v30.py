import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16 spacing
# "해당 프로젝트는 {{ total_days }} 일이 소요될 것이다."
# Maybe it's fragmented
print("P16 spacing search:")
idx = content.find("{{ total_days }}")
if idx != -1:
    print(content[idx-200:idx+500])

# p15 deadline
print("P15 deadline search:")
idx_2026 = content.find("2026년 12월 31일")
if idx_2026 != -1:
    print(f"Found 2026-12-31 at {idx_2026}: {content[idx_2026-100:idx_2026+300]}")

# p17 Table labels
print("P17 label search:")
idx_jik = content.find("직책", 4600000)
if idx_jik != -1:
    print(f"jik at {idx_jik}: {content[idx_jik-100:idx_jik+500]}")

