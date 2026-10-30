import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:facilityflow/pages/indent_detail_screen.dart';
import 'package:facilityflow/pages/create_indent_screen.dart';
import 'package:facilityflow/pages/material_issues_screen.dart';

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
    'Rejected',
    'Closed',
  ];

  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    // Auto-fetch fresh data as soon as the screen opens (silent = no spinner if cache exists)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = context.read<AppState>();
      appState.fetchIndents(isSilentUpdate: appState.indents.isNotEmpty);
    });
  }

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
      case 'Closed':
        return const Color(0xFF94A3B8);
      default:
        return const Color(0xFF64748B);
    }
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStart
          ? (_startDate ?? DateTime.now())
          : (_endDate ?? DateTime.now()),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppState.of(context, listen: true);
    final theme = Theme.of(context);

    final uniqueInstitutions = [
      'All',
      ...appState.indents
          .map((e) => e.institutionName)
          .where((e) => e.isNotEmpty)
          .toSet()
    ];
    final uniqueDepartments = [
      'All',
      ...appState.indents
          .map((e) => e.department)
          .where((e) => e.isNotEmpty)
          .toSet()
    ];
    final uniqueBuildings = [
      'All',
      ...appState.indents
          .map((e) => e.buildingName)
          .where((e) => e.isNotEmpty)
          .toSet()
    ];

    // Filter logic
    final filteredIndents = appState.indents.where((indent) {
      final matchesSearch = _searchQuery.isEmpty ||
          indent.indentNumber
              .toLowerCase()
              .contains(_searchQuery.toLowerCase()) ||
          indent.department
              .toLowerCase()
              .contains(_searchQuery.toLowerCase()) ||
          indent.items.any((item) => item.materialName
              .toLowerCase()
              .contains(_searchQuery.toLowerCase()));
      final matchesStatus =
          _selectedStatus == 'All' || indent.status == _selectedStatus;
      final matchesInst = _selectedInstitution.toUpperCase() == 'ALL' ||
          indent.institutionName == _selectedInstitution;
      final matchesDept = _selectedDepartment == 'All' ||
          indent.department == _selectedDepartment;
      final matchesBldg = _selectedBuilding == 'All' ||
          indent.buildingName == _selectedBuilding;

      bool matchesDate = true;
      if (_startDate != null) {
        final start =
            DateTime(_startDate!.year, _startDate!.month, _startDate!.day);
        final indentDate =
            DateTime(indent.date.year, indent.date.month, indent.date.day);
        if (indentDate.isBefore(start)) matchesDate = false;
      }
      if (_endDate != null) {
        final end = DateTime(_endDate!.year, _endDate!.month, _endDate!.day);
        final indentDate =
            DateTime(indent.date.year, indent.date.month, indent.date.day);
        if (indentDate.isAfter(end)) matchesDate = false;
      }

      return matchesSearch &&
          matchesStatus &&
          matchesInst &&
          matchesDept &&
          matchesBldg &&
          matchesDate;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Material Indents',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.receipt_long),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const MaterialIssuesScreen(),
                    ),
                  );
                },
              ),
              if (appState.materialIssues.any((issue) => !issue.isAcknowledged))
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    constraints:
                        const BoxConstraints(minWidth: 12, minHeight: 12),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Syncing with .NET API...')),
              );
              appState.fetchIndents();
              appState.fetchIssues();
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
                  hintText: 'Search by Indent #, Dept, or Material',
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
            // Date Filters Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectDate(context, true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade400),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _startDate == null
                                  ? 'From Date'
                                  : '${_startDate!.day}/${_startDate!.month}/${_startDate!.year}',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: _startDate == null
                                      ? Colors.grey
                                      : Colors.black),
                            ),
                            const Icon(Icons.calendar_today,
                                size: 14, color: Colors.grey),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectDate(context, false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade400),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _endDate == null
                                  ? 'To Date'
                                  : '${_endDate!.day}/${_endDate!.month}/${_endDate!.year}',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: _endDate == null
                                      ? Colors.grey
                                      : Colors.black),
                            ),
                            const Icon(Icons.calendar_today,
                                size: 14, color: Colors.grey),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (_startDate != null || _endDate != null)
                    IconButton(
                      icon: const Icon(Icons.clear, size: 16),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        setState(() {
                          _startDate = null;
                          _endDate = null;
                        });
                      },
                    ),
                ],
              ),
            ),
            // Dropdown Filters - Row 1: Institution (full width)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Institution',
                      style: TextStyle(fontSize: 11, color: Colors.grey)),
                  const SizedBox(height: 2),
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade400),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        isDense: true,
                        value: uniqueInstitutions.contains(_selectedInstitution)
                            ? _selectedInstitution
                            : 'All',
                        items: uniqueInstitutions.map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12)),
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
                  const SizedBox(height: 8),
                  // Row 2: Department + Building side by side
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Department',
                                style: TextStyle(
                                    fontSize: 11, color: Colors.grey)),
                            const SizedBox(height: 2),
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade400),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  isExpanded: true,
                                  isDense: true,
                                  value: uniqueDepartments
                                          .contains(_selectedDepartment)
                                      ? _selectedDepartment
                                      : 'All',
                                  items: uniqueDepartments.map((String value) {
                                    return DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(value,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 12)),
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
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Building',
                                style: TextStyle(
                                    fontSize: 11, color: Colors.grey)),
                            const SizedBox(height: 2),
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade400),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  isExpanded: true,
                                  isDense: true,
                                  value: uniqueBuildings
                                          .contains(_selectedBuilding)
                                      ? _selectedBuilding
                                      : 'All',
                                  items: uniqueBuildings.map((String value) {
                                    return DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(value,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 12)),
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
                    ],
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
                          'dd-MMM-yyyy',
                        ).format(indent.date);
                        final statusColor = _getStatusColor(indent.status);
                        final displayStatus = indent.status == 'Submitted'
                            ? 'Pending L${indent.currentApprovalLevel} Approval'
                            : indent.status;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () {
                              if (indent.status == 'Draft') {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        CreateIndentScreen(cloneFrom: indent),
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
