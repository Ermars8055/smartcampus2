import re

file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/create_indent_screen.dart'
with open(file_path, 'r') as f:
    content = f.read()

# Remove attachment block
content = re.sub(r"if \(_attachment != null\) \{.*?payload\['attachment_url'\] = uploadRes\.data\['path'\];\n\s*\}\n\s*\}", "", content, flags=re.DOTALL)

# Remove the whole photo attachment container UI
# The container has "Attach Photo (Optional)" inside
# Just replace any mention of _attachment with a simple text or remove it
content = re.sub(r"Text\(\n\s*_attachment != null.*?: 'Attach Photo \(Optional\)',", "Text('Attach Photo (Optional)',", content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)

print("Fixed build errors 3")
