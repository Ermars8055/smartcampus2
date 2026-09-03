import re

# 1. Fix create_indent_screen.dart File issue
file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/create_indent_screen.dart'
with open(file_path, 'r') as f:
    content = f.read()

content = re.sub(r"\s*File\? _attachment;", "", content)
content = re.sub(r"\s*_attachment = File\(pickedFile\.path\);", "", content)

# 2. Add `indentId` parameter to `CreateIndentScreen`
old_constructor = "const CreateIndentScreen({super.key, this.linkedComplaintId, this.cloneFrom});"
new_constructor = "const CreateIndentScreen({super.key, this.linkedComplaintId, this.cloneFrom, this.indentId});\n  final int? indentId;"
content = content.replace(old_constructor, new_constructor)

with open(file_path, 'w') as f:
    f.write(content)

print("Fixed build errors")
