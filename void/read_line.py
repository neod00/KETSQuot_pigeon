file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 3038: # Line 3039 0-indexed
             print(line)
             break
