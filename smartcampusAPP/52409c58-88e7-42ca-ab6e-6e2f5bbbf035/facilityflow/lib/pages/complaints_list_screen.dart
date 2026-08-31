import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:facilityflow/pages/log_complaint_screen.dart';
import 'package:facilityflow/models/complaint.dart';
import 'package:intl/intl.dart';
import 'package:facilityflow/pages/complaint_detail_screen.dart';

@NowaGenerated()
class ComplaintsListScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const ComplaintsListScreen({super.key});

  @override
  State<ComplaintsListScreen> createState() => _ComplaintsListScreenState();
}

class _ComplaintsListScreenState extends State<ComplaintsListScreen> {
  String _searchQuery = '';

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

  @override
  Widget build(BuildContext context) {
    final appState = AppState.of(context, listen: true);
    final theme = Theme.of(context);
    final complaints = appState.complaints.where((c) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return c.docketNo.toLowerCase().contains(q) ||
          c.natureOfComplaint.toLowerCase().contains(q) ||
          c.location.toLowerCase().contains(q);
    }).toList();

    final allComplaints = complaints;
    final openComplaints = complaints
        .where(
          (c) =>
              c.status == 'Registered' ||
              c.status == 'Open' ||
              c.status == 'Assigned',
        )
        .toList();
    final underInspectionComplaints = complaints.where((c) => c.status == 'Under Inspection').toList();
    final materialPendingComplaints = complaints.where((c) => c.status == 'Material Pending').toList();
    final pendingApprovalComplaints = complaints.where((c) => c.status == 'Pending Approval').toList();
    final inProgressComplaints = complaints.where((c) => c.status == 'In Progress').toList();
    final reopenedComplaints = complaints.where((c) => c.status == 'Reopened').toList();
    final closedComplaints =
        complaints.where((c) => c.status == 'Closed' || c.status == 'Resolved' || c.status == 'Rejected').toList();

    return DefaultTabController(
      length: 8,
      child: Scaffold(
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
                appState.fetchComplaints();
              },
            ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Color(0xFF93C5FD),
            tabs: [
              Tab(text: 'All'),
              Tab(text: 'Open / Assigned'),
              Tab(text: 'Under Inspection'),
              Tab(text: 'Material Pending'),
              Tab(text: 'Pending Approval'),
              Tab(text: 'In Progress'),
              Tab(text: 'Reopened'),
              Tab(text: 'Closed'),
            ],
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
              Expanded(
                child: TabBarView(
                  children: [
                    _buildComplaintList(context, allComplaints, 'No complaints match your search.'),
                    _buildComplaintList(context, openComplaints, 'No open complaints match your search.'),
                    _buildComplaintList(context, underInspectionComplaints, 'No under inspection complaints match your search.'),
                    _buildComplaintList(context, materialPendingComplaints, 'No material pending complaints match your search.'),
                    _buildComplaintList(context, pendingApprovalComplaints, 'No pending approval complaints match your search.'),
                    _buildComplaintList(context, inProgressComplaints, 'No in-progress complaints match your search.'),
                    _buildComplaintList(context, reopenedComplaints, 'No reopened complaints match your search.'),
                    _buildComplaintList(context, closedComplaints, 'No closed complaints match your search.'),
                  ],
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
              MaterialPageRoute(
                builder: (context) => const LogComplaintScreen(),
              ),
            );
          },
          icon: const Icon(Icons.add_comment),
          label: const Text('Log Issue'),
        ),
      ),
    );
  }

  Widget _buildComplaintList(
    BuildContext context,
    List<Complaint> list,
    String emptyMessage,
  ) {
    final theme = Theme.of(context);
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.search_off,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final complaint = list[index];
        final formattedDate = DateFormat(
          'dd MMM yyyy, hh:mm a',
        ).format(complaint.complaintDate);
        final statusColor = _getStatusColor(complaint.status);
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      ComplaintDetailScreen(complaint: complaint),
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
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(color: statusColor, width: 1),
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
                  const SizedBox(height: 12),
                  Text(
                    complaint.natureOfComplaint,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (complaint.location.isNotEmpty)
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
                        Icon(
                          Icons.inventory_2_outlined,
                          size: 16,
                          color: theme.colorScheme.tertiary,
                        ),
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
                  const Divider(
                    height: 24,
                    thickness: 1,
                    color: Color(0xFFF1F5F9),
                  ),
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
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
