file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/create_indent_screen.dart'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Store / Warehouse
content = content.replace("String? _selectedStoreId;", "")
content = content.replace("String? _selectedStoreName;", "")
content = content.replace("String? _selectedWarehouse;", "")
content = content.replace("List<Map<String, dynamic>> _warehouses = [];", "")

# Remove warehouse fetch from _fetchInitialData
import re
content = re.sub(r"final wRes = await api\.dio\.get\('/api/warehouses'\);.*?_warehouses = List<Map<String, dynamic>>\.from\(wRes\.data\);", "", content, flags=re.DOTALL)

# Remove warehouse dropdown from build
content = re.sub(r"// Store / Warehouse.*?DropdownButtonFormField<String>\(.*?onChanged: \(value\) \{.*?_selectedWarehouse = value;.*?\},.*?\),", "", content, flags=re.DOTALL)

# Remove _selectedWarehouse from validation
content = re.sub(r"if \(_selectedWarehouse == null\) \{.*?return;\n\s*\}", "", content, flags=re.DOTALL)

# Remove warehouse_id from payload
content = re.sub(r"'warehouse_id': int\.parse\(_selectedWarehouse!\),", "", content)

# 2. UOM Decimals 2
# We need to find the TextFormField for quantity inside the items list
# It has: keyboardType: TextInputType.number,
import re
content = re.sub(
    r"keyboardType: TextInputType\.number,\n\s*onChanged: \(value\) \{",
    r"keyboardType: const TextInputType.numberWithOptions(decimal: true),\n"
    r"                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\\d+\\.?\\d{0,2}'))],\n"
    r"                            onChanged: (value) {",
    content
)

# Add import for FilteringTextInputFormatter if not exists
if "import 'package:flutter/services.dart';" not in content:
    content = content.replace("import 'package:flutter/material.dart';", "import 'package:flutter/material.dart';\nimport 'package:flutter/services.dart';")

# 3. Draft vs Submit buttons
content = content.replace("Future<void> _submit() async {", "Future<void> _submit({bool isDraft = false}) async {")
content = content.replace("'status': 'Submitted',", "'status': isDraft ? 'Draft' : 'Submitted',")

buttons_old = """            Expanded(
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
                  backgroundColor: theme.colorScheme.primary,"""

buttons_new = """            Expanded(
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
                  backgroundColor: theme.colorScheme.primary,"""

content = content.replace(buttons_old, buttons_new)

with open(file_path, 'w') as f:
    f.write(content)

