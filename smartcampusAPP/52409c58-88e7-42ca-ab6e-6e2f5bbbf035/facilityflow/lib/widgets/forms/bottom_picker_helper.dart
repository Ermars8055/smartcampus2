import 'package:flutter/material.dart';

void showBottomPicker({
  required BuildContext context,
  required String title,
  required List<dynamic> items,
  required String? selectedValue,
  required String idField,
  required String nameField,
  required Function(String) onSelect,
}) {
  final theme = Theme.of(context);
  showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView(
              children: items.map((item) {
                final id = item[idField]?.toString();
                final name = item[nameField]?.toString();
                final isSelected = selectedValue == id;
                return ListTile(
                  title: Text(name ?? ''),
                  trailing: isSelected
                      ? Icon(Icons.check, color: theme.colorScheme.primary)
                      : null,
                  onTap: () {
                    if (id != null) onSelect(id);
                    Navigator.pop(context);
                  },
                );
              }).toList(),
            ),
          ),
        ],
      ),
    ),
  );
}
