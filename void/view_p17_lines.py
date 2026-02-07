file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Line 3046:")
print(repr(lines[3045]))
print("\nLine 3047:")
print(repr(lines[3046]))
print("\nLine 3048:")
print(repr(lines[3047]))
