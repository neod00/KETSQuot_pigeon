import re
with open('web-app/src/constants/template.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the border line or the next row's container and push it down.
# However, pdf2htmlEX uses absolute 'y' positions for everything.
# A proper fix would require making the whole table layout relative, which is extremely hard.
# A simpler workaround: Adjust the 'y' positions of all elements BELOW the target_sites area
# when the content grows. But we can't do that at runtime in a static HTML string easily.

# Let's see if we can at least make the cell background white to cover the original lines,
# OR if there's a simple way to remove the fixed height of the inner span too.

idx = content.find('{{ target_sites }}')
if idx != -1:
    print("Verifying applied styles:")
    print(content[idx-500:idx+500])
