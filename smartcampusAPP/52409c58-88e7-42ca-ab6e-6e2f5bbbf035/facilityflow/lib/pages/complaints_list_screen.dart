import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:facilityflow/services/api_service.dart';
import 'package:facilityflow/pages/log_complaint_screen.dart';
import 'package:facilityflow/models/complaint.dart';
import 'package:intl/intl.dart';
import 'package:facilityflow/pages/complaint_detail_screen.dart';
import 'package:facilityflow/pages/edit_complaint_screen.dart';

@NowaGenerated()
class ComplaintsListScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const ComplaintsListScreen({super.key});

  @override
  State<ComplaintsListScreen> createState() => _ComplaintsListScreenState();
}

class _ComplaintsListScreenState extends State<ComplaintsListScreen> with SingleTickerProviderStateMixin {
  String _searchQuery = '';
  int _currentPage = 0;
  int _rowsPerPage = 10;
  
  late TabController _tabController;
  final List<String> _tabs = [
    'All',
    'Open / Assigned',
    'Under Inspection',
    'Material Pending',
    'Pending Approval',
    'In Progress',
    'Reopened',
    'Closed'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      setState(() {
        _currentPage = 0;
      });
      _fetchData();
    }
  }

  String? _getApiStatusForTab(int index) {
    switch (index) {
      case 0: return null; // All
      case 1: return 'Registered,Open,Assigned';
      case 2: return 'Under Inspection';
      case 3: return 'Material Pending';
      case 4: return 'Pending Approval';
      case 5: return 'In Progress';
      case 6: return 'Reopened';
      case 7: return 'Closed,Resolved,Rejected';
      default: return null;
    }
  }

  void _fetchData() {
    final appState = AppState.of(context, listen: false);
    appState.fetchComplaints(
      skip: _currentPage * _rowsPerPage,
      limit: _rowsPerPage,
      status: _getApiStatusForTab(_tabController.index),
      search: _searchQuery,
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Registered':
        return const Color(0xFF2563EB);
      case 'Assigned':
        return const Color(0xFF0284C7);
      case 'Under Inspection':
        return const Color(0xFFD97706);
      case 'Material Pending':
        return const Color(0xFFEA580C);
      case 'In Progress':
        return const Color(0xFF4F46E5);
      case 'Closed':
        return const Color(0xFF059669);
      default:
        return const Color(0xFF64748B);
    }
  }

  Future<void> _showCancelDialog(int complaintId) async {
    final reasonController = TextEditingController();
    bool isSubmitting = false;

    await showDialog(
        context: context,
        builder: (ctx) {
          return StatefulBuilder(builder: (dialogCtx, setStateDialog) {
            return AlertDialog(
              title: const Text('Cancel Complaint'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Please provide a reason for cancelling this complaint.'),
                  const SizedBox(height: 16),
                  TextField(
                    controller: reasonController,
                    decoration: const InputDecoration(
                        labelText: 'Reason for cancellation',
                        border: OutlineInputBorder()),
                    maxLines: 3,
                    maxLength: 255,
                  ),
                ],
              ),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close')),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          if (reasonController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Reason is required')));
                            return;
                          }
                          setStateDialog(() => isSubmitting = true);
                          try {
                            await ApiService().updateComplaint(complaintId, {
                              'status': 'Closed',
                              'resolution_remarks': reasonController.text
                            });
                            if (mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Complaint cancelled successfully')));
                              _fetchData();
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Failed to cancel complaint')));
                            }
                          } finally {
                            if (mounted)
                              setStateDialog(() => isSubmitting = false);
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator())
                      : const Text('Cancel Complaint'),
                )
              ],
            );
          });
        });
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppState.of(context, listen: true);
    final theme = Theme.of(context);
    final complaints = appState.complaints;
    final totalItems = appState.totalComplaintsCount;
    final totalPages = _rowsPerPage > 0 ? (totalItems / _rowsPerPage).ceil() : 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Maintenance Complaints',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Syncing with .NET API...')),
              );
              _fetchData();
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          indicator: const UnderlineTabIndicator(
            borderSide: BorderSide(width: 3.0, color: Colors.white),
            insets: EdgeInsets.symmetric(horizontal: 16.0),
          ),
          labelColor: Colors.white,
          unselectedLabelColor: const Color(0xFF93C5FD),
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search by Docket #, Nature, or Location',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                ),
                onChanged: (value) {
                  _searchQuery = value;
                  _currentPage = 0;
                  // Debounce could be added here, but for now just fetch
                  _fetchData();
                },
              ),
            ),
            
            // List View
            Expanded(
              child: appState.isLoadingComplaints
                  ? const Center(child: CircularProgressIndicator())
                  : complaints.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.inbox_outlined,
                                    size: 64, color: theme.colorScheme.outlineVariant),
                                const SizedBox(height: 16),
                                Text('No complaints found.',
                                    style: TextStyle(
                                        color: theme.colorScheme.onSurfaceVariant,
                                        fontSize: 16),
                                    textAlign: TextAlign.center),
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: complaints.length,
                          itemBuilder: (context, index) {
                            final complaint = complaints[index];
                            final formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(complaint.complaintDate);
                            final statusColor = _getStatusColor(complaint.status);
                            
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(12),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ComplaintDetailScreen(complaint: complaint),
                                    ),
                                  );
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              complaint.docketNo,
                                              style: theme.textTheme.titleMedium?.copyWith(
                                                fontWeight: FontWeight.bold,
                                                color: theme.colorScheme.primary,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: statusColor.withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: statusColor.withValues(alpha: 0.5)),
                                            ),
                                            child: Text(
                                              complaint.status,
                                              style: TextStyle(
                                                color: statusColor,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        complaint.natureOfComplaint,
                                        style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                                      ),
                                      const SizedBox(height: 4),
                                      if (complaint.location.isNotEmpty)
                                        Row(
                                          children: [
                                            const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                complaint.location,
                                                style: theme.textTheme.bodyMedium,
                                              ),
                                            ),
                                          ],
                                        ),
                                      const SizedBox(height: 4),
                                      if (complaint.materialRequired)
                                        Row(
                                          children: [
                                            Icon(Icons.inventory_2_outlined, size: 16, color: theme.colorScheme.tertiary),
                                            const SizedBox(width: 8),
                                            Text(
                                              'Requires Materials',
                                              style: theme.textTheme.bodySmall?.copyWith(
                                                color: theme.colorScheme.tertiary,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      const Divider(height: 24, thickness: 1, color: Color(0xFFF1F5F9)),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              complaint.individualDetailed,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: theme.textTheme.bodySmall,
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Text(formattedDate, style: theme.textTheme.bodySmall),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      if (['Registered', 'Open', 'Reopened'].contains(complaint.status) && !complaint.isPmCalibrationCall)
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            IconButton(
                                              icon: const Icon(Icons.edit, color: Colors.blue),
                                              onPressed: () async {
                                                final result = await Navigator.push(
                                                  context,
                                                  MaterialPageRoute(
                                                    builder: (context) => EditComplaintScreen(complaintId: complaint.id),
                                                  ),
                                                );
                                                if (result == true) {
                                                  _fetchData();
                                                }
                                              },
                                              tooltip: 'Edit Complaint',
                                            ),
                                            if (['Registered', 'Open'].contains(complaint.status) && !complaint.isPmCalibrationCall)
                                              IconButton(
                                                icon: const Icon(Icons.cancel, color: Colors.red),
                                                onPressed: () => _showCancelDialog(complaint.id),
                                                tooltip: 'Cancel Complaint',
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
            
            // Bottom Pagination Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, -2),
                  )
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Left side: Compact pagination
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      DropdownButton<int>(
                        value: _rowsPerPage,
                        underline: const SizedBox(),
                        style: theme.textTheme.bodySmall,
                        iconSize: 16,
                        isDense: true,
                        items: [10, 20, 50, 100]
                            .map((e) => DropdownMenuItem(value: e, child: Text('$e')))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) {
                            setState(() {
                              _rowsPerPage = v;
                              _currentPage = 0;
                            });
                            _fetchData();
                          }
                        },
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${totalItems == 0 ? 0 : (_currentPage * _rowsPerPage) + 1}-${((_currentPage * _rowsPerPage) + _rowsPerPage).clamp(0, totalItems)}/$totalItems',
                        style: theme.textTheme.bodySmall,
                      ),
                      IconButton(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        constraints: const BoxConstraints(),
                        iconSize: 20,
                        icon: const Icon(Icons.chevron_left),
                        onPressed: _currentPage > 0
                            ? () {
                                setState(() => _currentPage--);
                                _fetchData();
                              }
                            : null,
                      ),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        iconSize: 20,
                        icon: const Icon(Icons.chevron_right),
                        onPressed: _currentPage < totalPages - 1
                            ? () {
                                setState(() => _currentPage++);
                                _fetchData();
                              }
                            : null,
                      ),
                    ],
                  ),
                  // Right side: Log Issue button
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add_comment, size: 16),
                    label: const Text('Log Issue', style: TextStyle(fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.colorScheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      minimumSize: Size.zero,
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const LogComplaintScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
