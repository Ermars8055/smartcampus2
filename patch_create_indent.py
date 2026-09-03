import re

file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/create_indent_screen.dart'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Remove Warehouse fields from state
content = re.sub(r"String\? _selectedWarehouse;\n\s*List<Map<String, dynamic>> _warehouses = \[\];", "", content)

# 2. Remove warehouse fetch in `_fetchInitialData`
content = re.sub(r"final wRes = await api\.dio\.get\('/api/warehouses'\);.*?_warehouses = List<Map<String, dynamic>>\.from\(wRes\.data\);", "", content, flags=re.DOTALL)

# 3. Remove Warehouse dropdown from build
content = re.sub(r"// Store / Warehouse.*?DropdownButtonFormField<String>.*?_selectedWarehouse = value;.*?},\n\s*\),", "", content, flags=re.DOTALL)
content = re.sub(r"const SizedBox\(height: 16\),\n\s*const SizedBox\(height: 16\),", "const SizedBox(height: 16),", content)

# 4. Remove photo attachment
content = re.sub(r"List<File> _selectedImages = \[\];", "", content)
content = re.sub(r"Future<void> _attachPhoto\(\) async \{.*?\n\s*\}", "", content, flags=re.DOTALL)
content = re.sub(r"// Photo Attachment.*?_buildPhotoAttachment\(\),", "", content, flags=re.DOTALL)
content = re.sub(r"Widget _buildPhotoAttachment\(\) \{.*?\n\s*\}\n", "", content, flags=re.DOTALL)

# Remove ImagePicker from imports if present
content = re.sub(r"import 'package:image_picker/image_picker\.dart';", "", content)

# Remove dart:io
content = re.sub(r"import 'dart:io';", "", content)

# Remove `warehouse_id` from submit payload
content = re.sub(r"'warehouse_id': int\.parse\(_selectedWarehouse!\),", "", content)

# 5. UOM Decimals to 2
# We need to add filtering to TextFormField for quantity
qty_field_old = """                            keyboardType: TextInputType.number,
                            onChanged: (value) {"""
qty_field_new = """                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\\d+\\.?\\d{0,2}'))],
                            onChanged: (value) {"""
content = content.replace(qty_field_old, qty_field_new)

# Add filtering import
if 'FilteringTextInputFormatter' not in content:
    content = content.replace("import 'package:flutter/material.dart';", "import 'package:flutter/material.dart';\nimport 'package:flutter/services.dart';")

# 6. Save as Draft and Submit Buttons
# Look for _submit method
# It already takes `bool isDraft = false`? Let's check
if "_submit({bool isDraft = false})" not in content:
    content = content.replace("Future<void> _submit() async {", "Future<void> _submit({bool isDraft = false}) async {")
    content = content.replace("'status': 'Submitted',", "'status': isDraft ? 'Draft' : 'Submitted',")

# Update Bottom App Bar buttons
buttons_old = """        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Cancel'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit'),
              ),
            ),
          ],
        ),"""

buttons_new = """        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _isSubmitting ? null : () => _submit(isDraft: true),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Save as Draft'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : () => _submit(isDraft: false),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit'),
              ),
            ),
          ],
        ),"""

content = content.replace(buttons_old, buttons_new)

# Wait, if `_selectedWarehouse` validation was there, remove it
content = re.sub(r"if \(_selectedWarehouse == null\).*?ScaffoldMessenger.*?return;\n\s*\}", "", content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)

print("create_indent_screen.dart patched successfully")
