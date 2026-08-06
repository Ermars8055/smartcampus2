import 'package:flutter/material.dart';
import 'package:facilityflow/models/repair_work_order.dart';
import 'package:intl/intl.dart';

class RwoDetailScreen extends StatelessWidget {
  final RepairWorkOrder rwo;

  const RwoDetailScreen({super.key, required this.rwo});

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
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _getStatusColor(rwo.status);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          rwo.rwoNumber,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: statusColor.withValues(alpha: 0.5)),
              ),
              child: Row(
                children: [
                  Icon(Icons.build_circle, color: statusColor, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Current Status',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: statusColor.withValues(alpha: 0.8),
                          ),
                        ),
                        Text(
                          rwo.status,
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Link to Complaint
            if (rwo.complaintDocket != null) ...[
              Text(
                'Linked Complaint',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                margin: EdgeInsets.zero,
                elevation: 0,
                color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: theme.colorScheme.outlineVariant,
                  ),
                ),
                child: ListTile(
                  leading: Icon(
                    Icons.assignment,
                    color: theme.colorScheme.primary,
                  ),
                  title: Text(
                    rwo.complaintDocket!,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: const Text('View Original Complaint'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Navigate to complaint (Coming Soon)')),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
            ],

            Text(
              'Equipment Details',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildDetailCard([
              _buildDetailRow('Name', rwo.equipmentName ?? 'Unknown'),
              _buildDetailRow('Code', rwo.equipmentCode ?? 'Unknown'),
              _buildDetailRow('Serial', rwo.equipmentSerial ?? 'N/A'),
            ]),
            const SizedBox(height: 24),

            Text(
              'Repair Details',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildDetailCard([
              _buildDetailRow('Technician', rwo.technicianName ?? 'Unassigned'),
              _buildDetailRow('Vendor', rwo.vendorName ?? 'Internal'),
              if (rwo.contractNumber != null)
                _buildDetailRow('Contract', rwo.contractNumber!),
              _buildDetailRow('Material Req.', rwo.materialRequired ? 'Yes' : 'No'),
              _buildDetailRow(
                'Created',
                DateFormat('MMM dd, yyyy').format(rwo.createdAt),
              ),
              if (rwo.targetCompletionDate != null)
                _buildDetailRow(
                  'Target Date',
                  DateFormat('MMM dd, yyyy').format(rwo.targetCompletionDate!),
                ),
            ]),
            const SizedBox(height: 24),

            if (rwo.problemDescription != null && rwo.problemDescription!.isNotEmpty) ...[
              Text(
                'Problem Description',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                child: Text(
                  rwo.problemDescription!,
                  style: theme.textTheme.bodyMedium,
                ),
              ),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailCard(List<Widget> children) {
    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: children,
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
