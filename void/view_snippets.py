with open('p15.html', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('{{ assurance_level }}')
print("P15 Snippet:")
print(content[idx-200:idx+200])

with open('p17.html', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('회사명')
print("\nP17 Snippet:")
print(content[idx-200:idx+200])

with open('p3.html', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('본사')
print("\nP3 Snippet:")
print(content[idx-100:idx+500])
