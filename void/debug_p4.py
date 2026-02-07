
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pf4_start = content.find('id="pf4"')
pf5_start = content.find('id="pf5"')
page4 = content[pf4_start:pf5_start]

def debug_term(term):
    print(f"\n--- DEBUG: {term} ---")
    start_pos = 0
    while True:
        idx = page4.find(term, start_pos)
        if idx == -1: break
        print(f"Match at {idx}: {page4[idx-40:idx+60]}")
        start_pos = idx + 1

debug_term("2,700,0")
debug_term("8,500,0")
debug_term("1,")
debug_term("350,000")
debug_term("신청비")
debug_term("면제")
