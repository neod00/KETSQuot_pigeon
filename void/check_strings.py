import re

content = open('web-app/src/constants/template.ts', 'r', encoding='utf-8').read()

print(f"'본사 주소' found: {content.find('본사 주소') != -1}")
print(f"'2026년 12월 31일' found: {content.find('2026년 12월 31일') != -1}")
print(f"'해당 프로젝트는' found: {content.find('해당 프로젝트는') != -1}")
print(f"'{{ assurance_level }}' found: {content.find('{{ assurance_level }}') != -1}")

