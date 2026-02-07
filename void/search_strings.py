
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

strings = ['회사명', '온실가스', 'QR.001', 'Dal Kim', 'dal.kim@lrqa.com', '+82-2-3703-']
for s in strings:
    count = content.count(s)
    print(f"Searching for {s}: {count}")
    if count > 0:
        idx = content.find(s)
        print(f"  Context: {content[idx-20:idx+50]}")
