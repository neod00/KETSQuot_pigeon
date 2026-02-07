import re
with open('LRQA_GHGP_contract.html', 'rb') as f:
    data = f.read()

# Search for '최' in bytes: \xec\xbb\xec
# Actually '최' is \xec\xb5\x9c in UTF-8
# '종' is \xec\xa2\x85 in UTF-8

try:
    content = data.decode('utf-8')
    print("Decoded as utf-8")
except:
    content = data.decode('cp949', errors='ignore')
    print("Decoded as cp949")

def search_near(w1, w2, text, dist=500):
    for m in re.finditer(re.escape(w1), text):
        sub = text[m.start():m.end()+dist]
        if w2 in sub:
            print(f"FOUND {w1}...{w2}")
            print(sub[:dist+len(w2)])
            print("="*40)

search_near('최', '종', content)
search_near('금', '액', content)
