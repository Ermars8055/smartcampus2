file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/create_indent_screen.dart'
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

for line in lines:
    if "if (_attachment != null) {" in line:
        skip = True
        continue
    
    if skip:
        if "}" in line and "uploadRes.data['path']" not in line and "payload['attachment_url']" not in line:
            # We need to skip until the closing brace of the if block
            # Actually just skip the exact 6 lines of that block
            pass
        if "      }" in line: # closing brace of if (_attachment != null)
            skip = False
        continue

    # for the UI part
    if "_attachment != null" in line and "?" in line:
        new_lines.append("                          'Attach Photo (Optional)',\n")
        continue
    if "? 'Image Attached:" in line:
        continue
    if ": 'Attach Photo (Optional)'," in line:
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)
print("Fixed lines")
