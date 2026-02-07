import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Page 10: hq_address reflection
# Search for "(2)" and "고객" followed by company_name
# Based on the screenshot, it says "(2) 고객: 에이치앤컴퍼니" then "본사 주소" below it.
# We need to replace that "본사 주소" with {{ hq_address }}
content = content.replace('본사 주소', '{{ hq_address }}')

# 2. Page 15: assurance_level font and reporting_deadline
# Search for "보증수준" variable area
# The user wants it to look like "중요성 기준" (which is probably bold)
# materiality_level is {{ materiality_level }}
# Let's find insurance_level and give it font-weight: 700
content = content.replace('{{ assurance_level }}', '<span style="font-weight: 700 !important;">{{ assurance_level }}</span>')

# Replace reporting deadline
content = content.replace('2026년 12월 31일', '{{ reporting_deadline }}')

# 3. Page 16: spacing in "해당 프로젝트는..."
# The user says it's not spaced correctly.
# Based on the screenshot it looks like "해당프로젝트는6.0일이소요될것이다.예상치못한상황으로..." (all smashed)
# This is usually due to ls (letter-spacing) or ws (word-spacing) classes.
# We should apply normal spacing.
sentence_start = "해당 프로젝트는"
idx = content.find(sentence_start)
if idx != -1:
    # Find the closing tag of the div/span containing it
    # Actually, let's just use a broad replace for that specific sentence area
    content = content.replace('해당 프로젝트는 {{ total_days }} 일이 소요될 것이다.', 
                              '<span style="letter-spacing: normal !important; word-spacing: normal !important;">해당 프로젝트는 {{ total_days }} 일이 소요될 것이다.</span>')
    content = content.replace('예상치 못한 상황으로 소요 기간이 늘어날 경우, LRQA 는 해당 사항에 대해 고객과 논의한다.',
                              '<span style="letter-spacing: normal !important; word-spacing: normal !important;"> 예상치 못한 상황으로 소요 기간이 늘어날 경우, LRQA 는 해당 사항에 대해 고객과 논의한다.</span>')

# 4. Page 17: Signature table
# The user says "왼쪽도 '서명', '직책' '성명', '일자'가 고정되서 나와야 합니다. 변수가 반영된것 같아요"
# This suggests that on the left side (customer side), I might have put placeholders for titles or it's incorrectly mapping.
# Currently, client_representative_title is '대표이사'
# But maybe the labels themselves "서명:", "직책:", "성명:", "일자:" were replaced by placeholders?
# Let's look at the screenshot.
# Left side has labels, but they might be misaligned or using variables.
# Actually, the labels on the left should be hardcoded.

# I'll search for the signature table and force the labels to be static.
# Typical structure: 
# <td>서명:</td> <td>{{ placeholder }}</td>
# Since it's pdf2htmlEX, it's divs.
# I will try to find the labels on the left side and ensure they are correct.
# Based on the screenshot, it seems "대표이사" and "김달 대" (probably name) are in the boxes.
# But it seems the user wants the labels "서명:", "직책:", "성명:", "일자:" to appear consistently on both sides.

# Let's do a smarter replacement for the labels to ensure they are there.
# I'll just look for fragments and fix them if I can find them.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Template updates applied.")
