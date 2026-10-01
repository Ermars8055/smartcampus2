import re

file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/indents_list_screen.dart'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Fix date picker to not allow future dates
content = content.replace('lastDate: DateTime(2101),', 'lastDate: DateTime.now(),')

# 2. Fix ALL institution filter
content = content.replace(
    "final matchesInst = _selectedInstitution == 'All' ||",
    "final matchesInst = _selectedInstitution.toUpperCase() == 'ALL' ||"
)

# 3. Fix timing format
content = content.replace(
    "'dd MMM yyyy, hh:mm a',",
    "'dd-MMM-yyyy',"
)

# 4. Draft indent opens CreateIndentScreen
on_tap_old = """                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      IndentDetailScreen(indent: indent),
                                ),
                              );
                            },"""

on_tap_new = """                            onTap: () {
                              if (indent.status == 'Draft') {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        CreateIndentScreen(indentId: indent.id),
                                  ),
                                );
                              } else {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        IndentDetailScreen(indent: indent),
                                  ),
                                );
                              }
                            },"""

content = content.replace(on_tap_old, on_tap_new)

# 5. Display Institution on card
# Let's insert it before the department
dept_row_old = """                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.business,
                                        size: 16,
                                        color: Colors.grey,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          indent.department,
                                          style: theme.textTheme.bodyLarge
                                              ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),"""

dept_row_new = """                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.account_balance,
                                        size: 16,
                                        color: Colors.grey,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          indent.institutionName.isNotEmpty ? indent.institutionName : 'N/A',
                                          style: theme.textTheme.bodyMedium?.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: Colors.grey[800],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
""" + dept_row_old

content = content.replace(dept_row_old, dept_row_new)

with open(file_path, 'w') as f:
    f.write(content)

print("indents_list_screen.dart patched successfully")
