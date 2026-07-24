import 'package:flutter/material.dart';
import 'package:facilityflow/models/indent.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:intl/intl.dart';

@NowaGenerated()
class IndentDetailScreen extends StatelessWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const IndentDetailScreen({super.key, required this.indent});

  final Indent indent;

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Draft':
        return const Color(0xFF64748B);
      case 'Awaiting Approval':
        return const Color(0xFFD97706);
      case 'Approved':
        return const Color(0xFF059669);
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
    final theme = Theme.of(context);
    final statusColor = _getStatusColor(indent.status);
    final formattedDate = DateFormat(
      'dd MMM yyyy, hh:mm a',
    ).format(indent.date);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          indent.indentNumber,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
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
                              indent.status,
                              style: TextStyle(
                                color: statusColor,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          Text(formattedDate, style: theme.textTheme.bodySmall),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'DEPARTMENT',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        indent.department,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'DELIVERY LOCATION',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(indent.location, style: theme.textTheme.bodyLarge),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (indent.remarks.isNotEmpty) ...[
                Text(
                  'Remarks / Purpose',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Card(
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      indent.remarks,
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Requested Items (${indent.items.length})',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Icon(
                    Icons.inventory_2,
                    color: theme.colorScheme.primary,
                    size: 20,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: indent.items.length,
                itemBuilder: (context, idx) {
                  final item = indent.items[idx];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.materialName,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              _buildQtyColumn(
                                context,
                                'Req',
                                item.requestedQuantity,
                                Colors.blue,
                              ),
                              _buildDivider(),
                              _buildQtyColumn(
                                context,
                                'Appr',
                                item.approvedQuantity,
                                Colors.amber,
                              ),
                              _buildDivider(),
                              _buildQtyColumn(
                                context,
                                'Issued',
                                item.issuedQuantity,
                                Colors.purple,
                              ),
                              _buildDivider(),
                              _buildQtyColumn(
                                context,
                                'Recd',
                                item.acknowledgedQuantity,
                                item.acknowledgedQuantity ==
                                            item.issuedQuantity &&
                                        item.issuedQuantity > 0
                                    ? Colors.green
                                    : Colors.grey,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 32,
      width: 1,
      color: const Color(0xFFE2E8F0),
      margin: const EdgeInsets.symmetric(horizontal: 12),
    );
  }

  Widget _buildQtyColumn(
    BuildContext context,
    String label,
    double qty,
    Color color,
  ) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            qty.toStringAsFixed(0),
            style: theme.textTheme.titleMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
