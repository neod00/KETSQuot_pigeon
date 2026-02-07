import re

with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

def find_page(page_id):
    start = content.find(f'id="{page_id}"')
    if start == -1:
        return None, None
    # Find the next page to determine the end
    next_page_num = int(page_id[2:]) + 1
    end = content.find(f'id="pf{next_page_num}"', start)
    if end == -1:
        end = len(content)
    return start, end

print("--- PAGE 10 ---")
s, e = find_page("pf10")
if s:
    segment = content[s:e]
    # Look for where address should go
    print(segment[:2000])

print("\n--- PAGE 15 ---")
s, e = find_page("pf15")
if s:
    segment = content[s:e]
    # Look for assurance_level and deadline
    print(segment[:2000])
    idx = segment.find("2026년 12월 31일")
    if idx != -1:
        print(f"Found deadline at offset {idx}: {segment[idx-100:idx+200]}")

print("\n--- PAGE 16 ---")
s, e = find_page("pf16")
if s:
    segment = content[s:e]
    # Look for "해당 프로젝트는"
    idx = segment.find("해당 프로젝트는")
    if idx != -1:
        print(f"Found sentence at offset {idx}: {segment[idx-100:idx+300]}")

print("\n--- PAGE 17 ---")
s, e = find_page("pf17")
if s:
    segment = content[s:e]
    # Look for signature table
    print(segment[:2000])
