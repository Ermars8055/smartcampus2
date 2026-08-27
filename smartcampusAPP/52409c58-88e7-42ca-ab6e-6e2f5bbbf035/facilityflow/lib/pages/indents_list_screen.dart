import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:intl/intl.dart';
import 'package:facilityflow/pages/indent_detail_screen.dart';
import 'package:facilityflow/pages/create_indent_screen.dart';

@NowaGenerated()
class IndentsListScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const IndentsListScreen({super.key});

  @override
  State<IndentsListScreen> createState() => _IndentsListScreenState();
}

class _IndentsListScreenState extends State<IndentsListScreen> {
  String _searchQuery = '';
  String _selectedStatus = 'All';
  String _selectedInstitution = 'All';
  String _selectedDepartment = 'All';
  String _selectedBuilding = 'All';

  final List<String> _statusOptions = [
    'All',
    'Draft',
    'Submitted',
    'Approved',
    'Issued',
    'Partially Issued',
    'Rejected'
  ];

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Draft':
        return const Color(0xFF64748B);
      case 'Submitted':
        return const Color(0xFF3B82F6); // Blue
      case 'Approved':
        return const Color(0xFF059669); // Green
      case 'Issued':
        return const Color(0xFF8B5CF6); // Purple
      case 'Rejected':
        return const Color(0xFFDC2626);
      case 'Partially Issued':
        return const Color(0xFF2563EB);
      case 'Converted to PO':
        return const Color(0xFF0D9488);
      case 'Cancelled':
        return const Color(0xFF94A3B8);
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppState.of(context, listen: true);
    final theme = Theme.of(context);

    final uniqueInstitutions = ['All', ...appState.indents.map((e) => e.institutionName).where((e) => e.isNotEmpty).toSet()];
    final uniqueDepartments = ['All', ...appState.indents.map((e) => e.department).where((e) => e.isNotEmpty).toSet()];
    final uniqueBuildings = ['All', ...appState.indents.map((e) => e.buildingName).where((e) => e.isNotEmpty).toSet()];

    // Filter logic
    final filteredIndents = appState.indents.where((indent) {
      final matchesSearch = _searchQuery.isEmpty ||
          indent.indentNumber
              .toLowerCase()
              .contains(_searchQuery.toLowerCase()) ||
          indent.department.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesStatus =
          _selectedStatus == 'All' || indent.status == _selectedStatus;
      final matchesInst = _selectedInstitution == 'All' || indent.institutionName == _selectedInstitution;
      final matchesDept = _selectedDepartment == 'All' || indent.department == _selectedDepartment;
      final matchesBldg = _selectedBuilding == 'All' || indent.buildingName == _selectedBuilding;
      return matchesSearch && matchesStatus && matchesInst && matchesDept && matchesBldg;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Material Indents',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Syncing with .NET API...')),
              );
              appState.fetchIndents();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search by Indent # or Department',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: theme.colorScheme.surfaceContainerHighest
                      .withValues(alpha: 0.5),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),
            // Dropdown Filters
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                children: [
                  Expanded(
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: uniqueInstitutions.contains(_selectedInstitution) ? _selectedInstitution : 'All',
                        hint: const Text('Institution'),
                        items: uniqueInstitutions.map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                          );
                        }).toList(),
                        onChanged: (newValue) {
                          setState(() {
                            _selectedInstitution = newValue!;
                          });
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: uniqueDepartments.contains(_selectedDepartment) ? _selectedDepartment : 'All',
                        hint: const Text('Department'),
                        items: uniqueDepartments.map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                          );
                        }).toList(),
                        onChanged: (newValue) {
                          setState(() {
                            _selectedDepartment = newValue!;
                          });
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: uniqueBuildings.contains(_selectedBuilding) ? _selectedBuilding : 'All',
                        hint: const Text('Building'),
                        items: uniqueBuildings.map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                          );
                        }).toList(),
                        onChanged: (newValue) {
                          setState(() {
                            _selectedBuilding = newValue!;
                          });
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Filter Chips
            SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _statusOptions.length,
                itemBuilder: (context, index) {
                  final status = _statusOptions[index];
                  final isSelected = status == _selectedStatus;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: FilterChip(
                      label: Text(status),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _selectedStatus = selected ? status : 'All';
                        });
                      },
                      selectedColor: theme.colorScheme.primaryContainer,
                      checkmarkColor: theme.colorScheme.primary,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            // List View
            Expanded(
              child: filteredIndents.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.search_off,
                            size: 64,
                            color: theme.colorScheme.secondary
                                .withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 16),
                          Text('No Indents Found',
                              style: theme.textTheme.titleLarge),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: filteredIndents.length,
                      itemBuilder: (context, index) {
                        final indent = filteredIndents[index];
                        final formattedDate = DateFormat(
                          'dd MMM yyyy, hh:mm a',
                        ).format(indent.date);
                        final statusColor = _getStatusColor(indent.status);
                        final displayStatus = indent.status == 'Submitted' ? 'Pending L${indent.currentApprovalLevel} Approval' : indent.status;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      IndentDetailScreen(indent: indent),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        indent.indentNumber,
                                        style: theme.textTheme.titleMedium
                                            ?.copyWith(
                                          color: theme.colorScheme.primary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: statusColor.withValues(
                                              alpha: 0.1),
                                          borderRadius:
                                              BorderRadius.circular(100),
                                          border: Border.all(
                                            color: statusColor,
                                            width: 1,
                                          ),
                                        ),
                                        child: Text(
                                          displayStatus,
                                          style: TextStyle(
                                            color: statusColor,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
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
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.location_on_outlined,
                                        size: 16,
                                        color: Colors.grey,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          indent.location,
                                          style: theme.textTheme.bodyMedium,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const Divider(
                                    height: 24,
                                    thickness: 1,
                                    color: Color(0xFFF1F5F9),
                                  ),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '${indent.items.length} ${indent.items.length == 1 ? 'item' : 'items'} requested',
                                        style:
                                            theme.textTheme.bodySmall?.copyWith(
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      Text(
                                        formattedDate,
                                        style: theme.textTheme.bodySmall,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: null,
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CreateIndentScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Indent'),
      ),
    );
  }
}
