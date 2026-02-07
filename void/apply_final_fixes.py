import re

file_path = 'web-app/src/constants/template.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Page 15 reporting_deadline fix
# We use the exact string found in Step 3176
target_p15_date = '202<span class="ls45">6</span></span><span class="ff4 ws9">년</span><span class="ff3"> <span class="_ _1"></span><span class="ls6c ws58">12<span class="ff4 ls7 ws9">월<span class="ff3 ws8"> 31<span class="_ _3"> </span></span>일'

if target_p15_date in content:
    content = content.replace(target_p15_date, '{{ reporting_deadline }}')
    print("Fix applied: Page 15 reporting_deadline")
else:
    print("Exact date string NOT found. Attempting fuzzy replacement...")
    # Fuzzy regex for Page 15 date: 202X년 XX월 XX일
    fuzzy_pattern = r'202<span[^>]*>6</span></span><span[^>]*>년</span><span[^>]*>\s*<span[^>]*></span><span[^>]*>12<span[^>]*>월<span[^>]*>\s*31<span[^>]*>\s*</span></span>일'
    new_content, count = re.subn(fuzzy_pattern, '{{ reporting_deadline }}', content)
    if count > 0:
        content = new_content
        print(f"Fix applied: Page 15 reporting_deadline (fuzzy, {count} occurrences)")
    else:
        print("Fuzzy replacement failed. Searching for simple pattern...")
        # Even simpler
        simple_pattern = r'202[46]<span[^>]*>.*?년.*?12.*?월.*?31.*?일'
        # Wait, I found '2024<span class="fs2"> </span>' in Step 3222 at 11555. That's likely not the one.
        # But let's check.
        # We know our target starts at 17658.
        
        # Let's try to target by position in line 3044 if all else fails.
        pass

# Final check for Page 17 labels
# Ensure we have 일자: label (it was missing in Step 3276)
if 'id="pf11"' in content:
    # Look for proposal_date_korean_long and see if it has '일자:' before it
    # We found in Step 3282: Context before: 'lass="ff2 ws8">: </span></div></div><div class="c x41 y26a w2e'
    # Wait, 'ws8">: </span>' suggests it HAD a colon.
    # Where was the word '일자'?
    # In Step 3276: '일자' was only found in '일자로부터'.
    
    # So the label '일자' is missing but the colon is there?
    # This might happen if the previous agent's replacement was partial.
    
    # Let's fix '일자' on Page 17.
    pass

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
