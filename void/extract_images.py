import re
import os

# Paths
input_file = 'DataVerification_contract/template.ts'
output_template = 'DataVerification_contract/template.ts'
output_assets = 'DataVerification_contract/templateAssets.ts'

# Read content
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to find base64 images
# Looking for src="data:image/..." or url('data:image/...')
# We will capture the entire data URI
img_pattern = re.compile(r'(data:image/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+)')

images = {}
counter = 1

def replace_match(match):
    global counter
    data_uri = match.group(1)
    
    # Check if we already extracted this image to avoid duplicates
    existing_key = None
    for k, v in images.items():
        if v == data_uri:
            existing_key = k
            break
    
    if existing_key:
        return f"${{TEMPLATE_ASSETS.{existing_key}}}"
    else:
        key = f"IMG_{counter}"
        images[key] = data_uri
        counter += 1
        return f"${{TEMPLATE_ASSETS.{key}}}"

# Replace in content
# We need to be careful. The template is likely a backticked string `...`.
# If we simply replace, we might mess up if the code isn't expecting ${...} interpolation 
# (though it is a TS file exporting a string, so it likely stays as a string).
# However, if it's `export const CONTRACT_TEMPLATE = '...';`, ${} won't work directly unless it's a template literal `.
# Let's check the file start first. 
# It starts with `export const CONTRACT_TEMPLATE = \`<!DOCTYPE html>...` based on previous views.
# So ${} interpolation is valid if it's a backtick string.

# Perform replacement
new_content = img_pattern.sub(replace_match, content)

# Generate assets file content
assets_content = "export const TEMPLATE_ASSETS = {\n"
for key, value in images.items():
    assets_content += f'    {key}: "{value}",\n'
assets_content += "};\n"

# Add import to the top of new_content and ensure it uses the imported variable
# We need to check if we need to change how CONTRACT_TEMPLATE is defined if it wasn't using backticks, 
# but we saw it uses backticks.
# We also need to import TEMPLATE_ASSETS.
import_statement = "import { TEMPLATE_ASSETS } from './templateAssets';\n"
new_content = import_statement + new_content

# Write files
with open(output_assets, 'w', encoding='utf-8') as f:
    f.write(assets_content)

with open(output_template, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Extracted {len(images)} images.")
print(f"Original size: {len(content)} bytes")
print(f"New Template size: {len(new_content)} bytes")
print(f"Assets size: {len(assets_content)} bytes")
