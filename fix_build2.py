import re

file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/create_indent_screen.dart'
with open(file_path, 'r') as f:
    content = f.read()

# Remove the upload image block
upload_block = r"if \(_attachment != null\) \{.*?\n\s*final uploadRes = await api\.uploadComplaintImage\(_attachment!\);\n.*?attachmentUrl = uploadRes\.data\['url'\];\n\s*\}"
content = re.sub(upload_block, "", content, flags=re.DOTALL)

# Remove the image attached text block
image_attached_block = r"const SizedBox\(height: 8\),\n\s*Text\(\n\s*_attachment != null\n\s*\? 'Image Attached: \$\{_attachment!\.path\.split\('/'\)\.last\}'\n\s*: 'No image attached',\n\s*style: const TextStyle\(fontSize: 12, color: Colors.grey\),\n\s*\),"
content = re.sub(image_attached_block, "", content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)

print("Fixed build errors 2")
