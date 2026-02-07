
file_path = 'LRQA_GHGP_contract.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def find_contexts(term):
    print(f"\n--- Contexts for {term} ---")
    start = 0
    while True:
        idx = content.find(term, start)
        if idx == -1: break
        # Find which page it is in
        page_id = "unknown"
        # Search backwards for id="pfX"
        p_idx = content.rfind('id="pf', 0, idx)
        if p_idx != -1:
            page_id = content[p_idx+4:content.find('"', p_idx+4)]
        
        print(f"Page {page_id}, Pos {idx}: {content[idx-30:idx+50]}")
        start = idx + 1

find_contexts('회사명')
find_contexts('본사')
find_contexts('주소')
find_contexts('일자')
