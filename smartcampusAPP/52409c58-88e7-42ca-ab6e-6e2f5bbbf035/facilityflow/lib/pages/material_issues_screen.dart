import 'package:flutter/material.dart';
import 'package:facilityflow/globals/app_state.dart';

class MaterialIssuesScreen extends StatefulWidget {
  const MaterialIssuesScreen({super.key});

  @override
  State<MaterialIssuesScreen> createState() => _MaterialIssuesScreenState();
}

class _MaterialIssuesScreenState extends State<MaterialIssuesScreen> {
  @override
  Widget build(BuildContext context) {
    final appState = AppState.of(context, listen: true);
    final issues = appState.materialIssues;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Material Issues (Receipts)',
            style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Syncing issues...')),
              );
              appState.fetchIssues();
            },
          ),
        ],
      ),
      body: appState.isLoadingIssues
          ? const Center(child: CircularProgressIndicator())
          : issues.isEmpty
              ? const Center(child: Text('No material issues found.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: issues.length,
                  itemBuilder: (context, index) {
                    final issue = issues[index];
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
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16),
                                ),
                                Chip(
                                  label: Text(
                                    issue.isAcknowledged
                                        ? 'Acknowledged'
                                        : 'Pending',
                                    style: const TextStyle(
                                        fontSize: 12, color: Colors.white),
                                  ),
                                  backgroundColor: issue.isAcknowledged
                                      ? Colors.green
                                      : Colors.orange,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (issue.relatedIndentId != null)
                              Text('Indent ID: ${issue.relatedIndentId}'),
                            if (issue.relatedComplaintId != null)
                              Text('Complaint ID: ${issue.relatedComplaintId}'),
                            if (issue.createdAt != null)
                              Text(
                                  'Date: ${issue.createdAt!.day}/${issue.createdAt!.month}/${issue.createdAt!.year}'),
                            const SizedBox(height: 12),
                            const Text('Items Issued:',
                                style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Table(
                              border:
                                  TableBorder.all(color: Colors.grey.shade300),
                              columnWidths: const {
                                0: FlexColumnWidth(2),
                                1: FlexColumnWidth(1),
                              },
                              children: [
                                TableRow(
                                  decoration: BoxDecoration(
                                      color: Colors.grey.shade100),
                                  children: const [
                                    Padding(
                                        padding: EdgeInsets.all(8.0),
                                        child: Text('Material',
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12))),
                                    Padding(
                                        padding: EdgeInsets.all(8.0),
                                        child: Text('Qty',
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12))),
                                  ],
                                ),
                                ...issue.items.map((item) {
                                  return TableRow(
                                    children: [
                                      Padding(
                                          padding: const EdgeInsets.all(8.0),
                                          child: Text(item.materialName,
                                              style: const TextStyle(
                                                  fontSize: 12))),
                                      Padding(
                                          padding: const EdgeInsets.all(8.0),
                                          child: Text(
                                              '${item.issuedQuantity} ${item.uomName}',
                                              style: const TextStyle(
                                                  fontSize: 12))),
                                    ],
                                  );
                                }),
                              ],
                            ),
                            if (!issue.isAcknowledged) ...[
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.green),
                                  onPressed: () async {
                                    final success = await appState
                                        .acknowledgeReceipt(issue.id);
                                    if (mounted) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                          content: Text(success
                                              ? 'Receipt Acknowledged Successfully'
                                              : 'Failed to acknowledge receipt'),
                                          backgroundColor: success
                                              ? Colors.green
                                              : Colors.red,
                                        ),
                                      );
                                    }
                                  },
                                  child: const Text('Acknowledge Receipt'),
                                ),
                              ),
                            ]
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
