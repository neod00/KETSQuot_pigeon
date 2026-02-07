file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in [3045, 3046, 3047]:
    print(f"Line {i+1} start: {repr(lines[i][:500])}")
    print(f"Line {i+1} end: {repr(lines[i][-500:])}")
    print("-" * 20)
