import re
path = 'LRQA_GHGP_contract.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Final Cost Bold (Page 2)
# Need to find labels and values
# Label usually has '최종 제안금액'
# Value has {{ final_cost }}, {{ total_days }}, etc.
# We will look for parent <div> and add bold font.

# 2. Page 15 Spacing fix for assurance_level
# Original was likely: <div ...>{{ assurance_level }}</div>
# We need to add style="word-spacing: normal; letter-spacing: normal;"

# 3. Page 17 '회사명' -> {{ company_name }}
# User says '회사명' is not changing and spacing is bad.

# 4. Page 3 '본사 및 대상 사업장' -> {{ target_sites }}
# User says they want to input this. page.tsx already has targetSites: '본사 및 대상 사업장'.
# But in template it might be hardcoded.

print("--- ANALYZING P2 ---")
p2 = re.search(r'<div[^>]*id="pf2".*?</div></div></div><div class="pi"', html, re.S)
if p2:
    print("Found P2 content")
    # For bold, we can look for divs with '최종 제안금액' and 'final_cost'
    
print("\n--- ANALYZING P15 ---")
p15 = re.search(r'<div[^>]*id="pf15".*?</div></div></div><div class="pi"', html, re.S)
if p15:
    print("Found P15 content")

print("\n--- ANALYZING P17 ---")
p17 = re.search(r'<div[^>]*id="pf17".*?</div></div>', html, re.S)
if p17:
    print("Found P17 content")
    
