import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("=== CHECKING PAGE 4 (Final Proposal Amount) ===")
# Search for "최종 제안금액"
matches = list(re.finditer(r'최종 제안금액', content))
for m in matches:
    start = max(0, m.start() - 200)
    end = min(len(content), m.end() + 200)
    print(f"Context for '최종 제안금액' at {m.start()}:")
    print(content[start:end])
    print("-" * 50)

# Check for "VAT 별도"
matches_vat = list(re.finditer(r'VAT 별도', content))
for m in matches_vat:
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 100)
    print(f"Context for 'VAT 별도' at {m.start()}:")
    print(content[start:end])
    print("-" * 50)


print("\n=== CHECKING PAGE 10 (Headquarters Address) ===")
# Search for "본사"
matches_hq = list(re.finditer(r'본사', content))
for m in matches_hq:
    start = max(0, m.start() - 200)
    end = min(len(content), m.end() + 300)
    print(f"Context for '본사' at {m.start()}:")
    print(content[start:end])
    print("-" * 50)

# Search for the placeholder specifically
if '{{ hq_address }}' in content:
    print("Found '{{ hq_address }}' placeholder.")
    matches_ph = list(re.finditer(r'\{\{ hq_address \}\}', content))
    for m in matches_ph:
        start = max(0, m.start() - 100)
        end = min(len(content), m.end() + 100)
        print(f"Context for placeholder at {m.start()}:")
        print(content[start:end])
else:
    print("ERROR: '{{ hq_address }}' placeholder NOT found in template.ts!")

