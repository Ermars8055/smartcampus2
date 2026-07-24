import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/models/material_issue.dart';
import 'package:facilityflow/globals/app_state.dart';

@NowaGenerated()
class AcknowledgementsScreen extends StatelessWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const AcknowledgementsScreen({super.key});

  void _showAcknowledgeDialog(BuildContext context, MaterialIssue issue) {
    final theme = Theme.of(context);
    final appState = AppState.of(context, listen: false);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Confirm Receipt',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you have received all the listed items for issue ${issue.issueNumber}?',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            ...issue.items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle_outline,
                      color: Colors.green,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${item.materialName} x ${item.issuedQuantity.toStringAsFixed(0)}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) => const Center(
                  child: Card(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text('Confirming Receipt...'),
                        ],
                      ),
                    ),
                  ),
                ),
              );
              final success = await appState.acknowledgeReceipt(issue.id);
              if (context.mounted) {
                Navigator.pop(context);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'Materials for ${issue.issueNumber} acknowledged successfully!',
                      ),
                      backgroundColor: const Color(0xFF059669),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Failed to acknowledge. Please try again.'),
                      backgroundColor: Color(0xFFDC2626),
                    ),
                  );
                }
              }
            },
            child: const Text('Acknowledge Receipt'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppState.of(context, listen: true);
    final theme = Theme.of(context);
    final issues = appState.materialIssues;
    final pendingIssues = issues
        .where((issue) => !issue.isAcknowledged)
        .toList();
    final acknowledgedIssues = issues
        .where((issue) => issue.isAcknowledged)
        .toList();
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: SafeArea(
          child: TabBarView(
            children: [
              _buildIssueList(
                context,
                pendingIssues,
                true,
                'No pending receipts. All issued materials are fully acknowledged!',
              ),
              _buildIssueList(
                context,
                acknowledgedIssues,
                false,
                'No history of acknowledgements.',
              ),
            ],
          ),
        ),
        appBar: AppBar(
          title: const Text(
            'Material Acknowledgements',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          bottom: const TabBar(
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Color(0xFF93C5FD),
            tabs: const [
              Tab(text: 'Pending Receipts'),
              Tab(text: 'Acknowledged History'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIssueList(
    BuildContext context,
    List<MaterialIssue> list,
    bool isPending,
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
                Icons.assignment_turned_in_outlined,
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
        final issue = list[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      issue.issueNumber,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (issue.isAcknowledged)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(
                            color: const Color(0xFF10B981),
                            width: 1,
                          ),
                        ),
                        child: const Text(
                          'Acknowledged',
                          style: TextStyle(
                            color: Color(0xFF059669),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(
                            color: const Color(0xFFF59E0B),
                            width: 1,
                          ),
                        ),
                        child: const Text(
                          'Pending Receipt',
                          style: TextStyle(
                            color: Color(0xFFD97706),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                if (issue.relatedIndentId != null)
                  Row(
                    children: [
                      const Icon(
                        Icons.receipt_long_outlined,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Related Indent ID: #${issue.relatedIndentId}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                if (issue.relatedComplaintId != null)
                  Row(
                    children: [
                      const Icon(
                        Icons.build_outlined,
                        size: 16,
                        color: Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Related Complaint ID: #${issue.relatedComplaintId}',
                        style: theme.textTheme.bodyMedium?.copyWith(
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
                Text(
                  'Issued Materials:',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: issue.items
                        .map(
                          (item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    item.materialName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                Text(
                                  'Qty: ${item.issuedQuantity.toStringAsFixed(0)}',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: theme.colorScheme.secondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
                if (isPending) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: () => _showAcknowledgeDialog(context, issue),
                      icon: const Icon(Icons.assignment_turned_in),
                      label: const Text(
                        'Acknowledge Receipt',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
