import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Page 15 deadline
# The exact string found was:
# '202<span class="ls45">6</span></span><span class="ff4 ws9">년</span><span class="ff3"> <span class="_ _1"></span><span class="ls6c ws58">12<span class="ff4 ls7 ws9">월<span class="ff3 ws8"> 31<span class="_ _3"> </span></span>일'

target_p15_date = '202<span class="ls45">6</span></span><span class="ff4 ws9">년</span><span class="ff3"> <span class="_ _1"></span><span class="ls6c ws58">12<span class="ff4 ls7 ws9">월<span class="ff3 ws8"> 31<span class="_ _3"> </span></span>일'

if target_p15_date in content:
    content = content.replace(target_p15_date, '{{ reporting_deadline }}')
    print("SUCCESS: Page 15 deadline replaced.")
else:
    print("ERROR: Exact date string NOT found. Checking for slightly varied version...")
    # Attempt a more flexible match if exact fail
    fuzzy = r'202<span[^>]*>6</span></span><span[^>]*>년</span><span[^>]*>\s*<span[^>]*></span><span[^>]*>12<span[^>]*>월<span[^>]*>\s*31<span[^>]*>\s*</span></span>일'
    new_content, count = re.subn(fuzzy, '{{ reporting_deadline }}', content)
    if count > 0:
        content = new_content
        print(f"SUCCESS: Page 15 deadline replaced (fuzzy, {count} occurrences).")
    else:
        print("FAILED: Could not find deadline on Page 15.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
