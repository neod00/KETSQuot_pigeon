with open('p3.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find the labels in the table to reconstruct it
labels = ['조직명', '검증 받을 조직의 위치 및 경계', '온실가스 선언이 적용되는 기간', '보증수준', '중요성']
for label in labels:
    idx = content.find(label)
    if idx != -1:
        # Find the value area near this label
        print(f"Label: {label} found at {idx}")
        print(content[idx-50:idx+300])
        print("-" * 30)
