import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# p16: "해당 프로젝트는 6.0 일이 소요될 것이다."
# Search for sub-parts
search_term = "해당"
for match in re.finditer(search_term, content[4620000:4640000]):
    start = 4620000 + match.start()
    print(f"Match found at {start}: {content[start:start+100]}")

# p17: Search for representative_title and name near pos 4670694
print("P17 table inspection near 4670694:")
print(content[4670600:4672000])

