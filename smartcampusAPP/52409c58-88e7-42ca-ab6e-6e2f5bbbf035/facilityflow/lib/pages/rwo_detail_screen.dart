import 'package:flutter/material.dart';
import 'package:facilityflow/models/repair_work_order.dart';
import 'package:facilityflow/services/api_service.dart';
import 'package:intl/intl.dart';

class RwoDetailScreen extends StatefulWidget {
  final RepairWorkOrder rwo;

  const RwoDetailScreen({super.key, required this.rwo});

  @override
  State<RwoDetailScreen> createState() => _RwoDetailScreenState();
}

class _RwoDetailScreenState extends State<RwoDetailScreen> {
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

  String _formatQty(double qty, String uom, bool uomAllowDecimal) {
    if (!uomAllowDecimal || qty == qty.toInt()) {
      return qty.toInt().toString();
    }
    return qty.toStringAsFixed(2);
  }

  void _showApproveDialog() {
    final List<TextEditingController> controllers = widget.rwo.items
        .map((e) => TextEditingController(text: e.quantity.toString()))
        .toList();
    final TextEditingController remarksController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        bool isSubmitting = false;
        return StatefulBuilder(builder: (dialogContext, setStateDialog) {
          return AlertDialog(
            title: const Text('Approve Work Order'),
            content: SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (widget.rwo.items.isNotEmpty) ...[
                    const Text('Adjust approved quantities if necessary:'),
                    const SizedBox(height: 16),
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: widget.rwo.items.length,
                        itemBuilder: (itemContext, idx) {
                          final item = widget.rwo.items[idx];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.materialName,
                                    style: const TextStyle(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                          'Req: ${_formatQty(item.quantity, item.uomName, item.uomAllowDecimal)} ${item.uomName}'),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: TextField(
                                        controller: controllers[idx],
                                        keyboardType: TextInputType.number,
                                        decoration: const InputDecoration(
                                          labelText: 'Approve Qty',
                                          isDense: true,
                                          border: OutlineInputBorder(),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  TextField(
                    controller: remarksController,
                    decoration: const InputDecoration(
                      labelText: 'Approval Remarks (Optional)',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        bool hasLargerQuantity = false;
                        bool allZero = true;
                        List<Map<String, dynamic>> payload = [];

                        for (int i = 0; i < widget.rwo.items.length; i++) {
                          double requestedQty = widget.rwo.items[i].quantity;
                          double approvedQty =
                              double.tryParse(controllers[i].text) ?? 0;
                          if (approvedQty > requestedQty) hasLargerQuantity = true;
                          if (approvedQty > 0) allZero = false;
                          payload.add({
                            'wo_item_id': widget.rwo.items[i].id,
                            'approved_quantity': approvedQty,
                          });
                        }

                        if (widget.rwo.items.isNotEmpty && allZero) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text(
                                    'Cannot approve 0 quantity for all items.')),
                          );
                          return;
                        }

                        if (hasLargerQuantity) {
                          bool? confirm = await showDialog<bool>(
                            context: ctx,
                            builder: (warningCtx) => AlertDialog(
                              title: const Text('Warning'),
                              content: const Text(
                                  'Approved quantity is larger than requested for some items. Proceed?'),
                              actions: [
                                TextButton(
                                    onPressed: () =>
                                        Navigator.pop(warningCtx, false),
                                    child: const Text('Cancel')),
                                ElevatedButton(
                                    onPressed: () =>
                                        Navigator.pop(warningCtx, true),
                                    child: const Text('Proceed')),
                              ],
                            ),
                          );
                          if (confirm != true) return;
                        }

                        setStateDialog(() => isSubmitting = true);
                        try {
                          await ApiService().approveRwo(
                            widget.rwo.id,
                            payload,
                            remarks: remarksController.text.isEmpty
                                ? null
                                : remarksController.text,
                          );
                          if (!mounted) return;
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (Navigator.canPop(context)) Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Work order approved successfully.')),
                          );
                        } catch (e) {
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to approve: $e')),
                          );
                        } finally {
                          setStateDialog(() => isSubmitting = false);
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : const Text('Confirm Approve'),
              ),
            ],
          );
        });
      },
    );
  }

  void _showRejectDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) {
        bool isSubmitting = false;
        return StatefulBuilder(builder: (dialogContext, setStateDialog) {
          return AlertDialog(
            title: const Text('Reject Work Order'),
            content: TextField(
              controller: controller,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Reason for Rejection *',
                border: OutlineInputBorder(),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        if (controller.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Please enter a reason for rejection.')),
                          );
                          return;
                        }
                        setStateDialog(() => isSubmitting = true);
                        try {
                          await ApiService()
                              .rejectRwo(widget.rwo.id, reason: controller.text);
                          if (!mounted) return;
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (Navigator.canPop(context)) Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Work order rejected.')),
                          );
                        } catch (e) {
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to reject: $e')),
                          );
                        } finally {
                          setStateDialog(() => isSubmitting = false);
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : const Text('Confirm Reject'),
              ),
            ],
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _getStatusColor(widget.rwo.status);
    final isPendingApproval = widget.rwo.status == 'Pending Approval' ||
        widget.rwo.status == 'Submitted';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.rwo.rwoNumber,
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
                          widget.rwo.status,
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
            if (widget.rwo.complaintDocket != null) ...[
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
                color: theme.colorScheme.surfaceContainerHighest
                    .withValues(alpha: 0.3),
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
                    widget.rwo.complaintDocket!,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: const Text('View Original Complaint'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content:
                              Text('Navigate to complaint (Coming Soon)')),
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
              _buildDetailRow('Name', widget.rwo.equipmentName ?? 'Unknown'),
              _buildDetailRow('Code', widget.rwo.equipmentCode ?? 'Unknown'),
              _buildDetailRow('Serial', widget.rwo.equipmentSerial ?? 'N/A'),
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
              _buildDetailRow(
                  'Technician', widget.rwo.technicianName ?? 'Unassigned'),
              _buildDetailRow('Vendor', widget.rwo.vendorName ?? 'Internal'),
              if (widget.rwo.contractNumber != null)
                _buildDetailRow('Contract', widget.rwo.contractNumber!),
              _buildDetailRow(
                  'Material Req.', widget.rwo.materialRequired ? 'Yes' : 'No'),
              _buildDetailRow(
                'Created',
                DateFormat('MMM dd, yyyy').format(widget.rwo.createdAt),
              ),
              if (widget.rwo.targetCompletionDate != null)
                _buildDetailRow(
                  'Target Date',
                  DateFormat('MMM dd, yyyy')
                      .format(widget.rwo.targetCompletionDate!),
                ),
            ]),
            const SizedBox(height: 24),

            if (widget.rwo.problemDescription != null &&
                widget.rwo.problemDescription!.isNotEmpty) ...[
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
                  border:
                      Border.all(color: theme.colorScheme.outlineVariant),
                ),
                child: Text(
                  widget.rwo.problemDescription!,
                  style: theme.textTheme.bodyMedium,
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Items / Materials List
            if (widget.rwo.items.isNotEmpty) ...[
              Text(
                'Material Items',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                elevation: 0,
                margin: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: widget.rwo.items.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final item = entry.value;
                    return Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.materialName,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold)),
                                    if (item.materialCode != null)
                                      Text(item.materialCode!,
                                          style: TextStyle(
                                              color: Colors.grey.shade600,
                                              fontSize: 12)),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${_formatQty(item.quantity, item.uomName, item.uomAllowDecimal)} ${item.uomName}',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600),
                                  ),
                                  if (item.approvedQuantity > 0)
                                    Text(
                                      'Approved: ${_formatQty(item.approvedQuantity, item.uomName, item.uomAllowDecimal)}',
                                      style: const TextStyle(
                                          color: Colors.green,
                                          fontSize: 12),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        if (idx < widget.rwo.items.length - 1)
                          const Divider(height: 1),
                      ],
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
      bottomNavigationBar: (isPendingApproval && widget.rwo.canUserApprove)
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                      color: Colors.black12,
                      blurRadius: 4,
                      offset: Offset(0, -2))
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _showRejectDialog,
                        icon: const Icon(Icons.cancel, color: Colors.red),
                        label: const Text('Reject',
                            style: TextStyle(color: Colors.red)),
                        style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.red)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _showApproveDialog,
                        icon: const Icon(Icons.check_circle),
                        label: const Text('Approve'),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
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
