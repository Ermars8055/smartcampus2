import 'package:flutter/material.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:facilityflow/models/repair_work_order.dart';
import 'package:facilityflow/pages/rwo_detail_screen.dart';
import 'package:intl/intl.dart';

class RwoListScreen extends StatefulWidget {
  const RwoListScreen({super.key});

  @override
  State<RwoListScreen> createState() => _RwoListScreenState();
}

class _RwoListScreenState extends State<RwoListScreen> {
  String _searchQuery = '';

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Assigned':
        return const Color(0xFF0284C7);
      case 'Awaiting Spare Parts':
        return const Color(0xFFD97706);
      case 'In Progress':
        return const Color(0xFF4F46E5);
      case 'Closed':
        return const Color(0xFF059669);
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AppState.of(context, listen: false).fetchRwos();
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppState.of(context, listen: true);
    final theme = Theme.of(context);

    if (appState.isLoadingRwos && appState.rwos.isEmpty) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final rwos = appState.rwos.where((r) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return r.rwoNumber.toLowerCase().contains(q) ||
          (r.equipmentName ?? '').toLowerCase().contains(q) ||
          (r.technicianName ?? '').toLowerCase().contains(q);
    }).toList();

    final assignedRwos = rwos.where((r) => r.status == 'Assigned').toList();
    final inProgressRwos = rwos.where((r) => r.status == 'In Progress' || r.status == 'Awaiting Spare Parts').toList();
    final closedRwos = rwos.where((r) => r.status == 'Closed').toList();

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Repair Work Orders',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Syncing RWOs...')),
                );
                appState.fetchRwos();
              },
            ),
          ],
          bottom: const TabBar(
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Color(0xFF93C5FD),
            tabs: [
              Tab(text: 'Assigned'),
              Tab(text: 'In Progress'),
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
                    hintText: 'Search by RWO #, Equipment, or Technician',
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
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildRwoList(context, assignedRwos, 'No assigned RWOs match your search.'),
                    _buildRwoList(context, inProgressRwos, 'No in-progress RWOs match your search.'),
                    _buildRwoList(context, closedRwos, 'No closed RWOs match your search.'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRwoList(BuildContext context, List<RepairWorkOrder> list, String emptyMessage) {
    final theme = Theme.of(context);
    
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
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
        final rwo = list[index];
        final formattedDate = DateFormat('dd MMM yyyy').format(rwo.createdAt);
        final statusColor = _getStatusColor(rwo.status);

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => RwoDetailScreen(rwo: rwo)),
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
                      Text(
                        rwo.rwoNumber,
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(color: statusColor, width: 1),
                        ),
                        child: Text(
                          rwo.status,
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
                    rwo.equipmentName ?? 'Unknown Equipment',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.person_outline, size: 16, color: Colors.grey),
                      const SizedBox(width: 8),
                      Text(
                        rwo.technicianName ?? 'Unassigned',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  if (rwo.materialRequired) ...[
                    const SizedBox(height: 4),
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
                  ],
                  const Divider(height: 24, thickness: 1, color: Color(0xFFF1F5F9)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        rwo.complaintDocket != null ? 'Linked: ${rwo.complaintDocket}' : 'No Link',
                        style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
                      ),
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
