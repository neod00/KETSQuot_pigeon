import sys

def check_file(name):
    print(f"--- {name} ---")
    with open(name, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if name == 'p2.html':
        # Look for '최종 제안금액'
        print("최종 exists:", '최종' in content)
        print("final_cost exists:", '{{ final_cost }}' in content)
    
    if name == 'p15.html':
        print("보증수준 exists:", '보증수준' in content)
        print("assurance_level exists:", '{{ assurance_level }}' in content)

    if name == 'p3.html':
        print("본사 exists:", '본사' in content)
        print("대상 exists:", '대상' in content)
        print("사업장 exists:", '사업장' in content)

    if name == 'p17.html':
        print("각각 exists:", '각각' in content)
        print("회사명 exists:", '회사명' in content)

check_file('p2.html')
check_file('p3.html')
check_file('p15.html')
check_file('p17.html')
