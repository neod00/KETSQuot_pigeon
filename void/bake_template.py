
import json

with open('LRQA_GHGP_contract.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Escape backticks for JS template literal
escaped_html = html.replace('`', '\\`').replace('${', '\\${')

ts_content = f"""
export const CONTRACT_TEMPLATE = `{escaped_html}`;
"""

with open('web-app/src/constants/template.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Baked HTML into template.ts")
