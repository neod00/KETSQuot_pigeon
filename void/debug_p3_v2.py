
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf3_start = content.find('id="pf3"')
pf4_start = content.find('id="pf4"')
page3 = content[pf3_start:pf4_start]

# More specific debug
def debug_term(term):
    print(f"\n--- DEBUG: {term} ---")
    start_pos = 0
    while True:
        idx = page3.find(term, start_pos)
        if idx == -1: break
        print(f"Match at {idx}: {page3[idx-60:idx+80]}")
        start_pos = idx + 1

debug_term("본사")
debug_term("대상")
debug_term("제한적")
debug_term("회사명")
debug_term("202")
